
import { hp2Builder } from '@selderee/plugin-htmlparser2';
import type { AnyNode } from 'domhandler';
import { parseDocument } from 'htmlparser2';
import { DecisionTree } from 'selderee';
import type { Picker } from 'selderee';
import { BlockTextBuilder } from './block-text-builder';
import type { Options, RecursiveCallback, TagDefinition } from './typedefs';
import { limitedDepthRecursive, unicodeEscape } from './util';

type TagPicker = Picker<AnyNode, TagDefinition>;

/**
 * Compile selectors into a decision tree,
 * return a function intended for batch processing.
 *
 * @param   { Options } [options = {}]   HtmlToText options (defaults, formatters, user options merged, deduplicated).
 * @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
 * @static
 */
function compile (options: Options): (html?: string, metadata?: unknown) => string {
  const selectors = options.selectors as Array<{ selector: string; format?: string; options?: unknown }>;
  const selectorsWithoutFormat = selectors.filter(s => !s.format);
  if (selectorsWithoutFormat.length) {
    throw new Error(
      'Following selectors have no specified format: ' +
      selectorsWithoutFormat.map(s => `\`${s.selector}\``).join(', ')
    );
  }
  const picker: TagPicker = new DecisionTree(
    selectors.map(s => [s.selector, s as TagDefinition])
  ).build(hp2Builder) as TagPicker;

  if (typeof options.encodeCharacters !== 'function') {
    options.encodeCharacters = makeReplacerFromDict(options.encodeCharacters);
  }

  const baseSelectorsPicker = new DecisionTree(
    options.baseElements.selectors.map((s, i) => [s, i + 1])
  ).build(hp2Builder) as Picker<AnyNode, number>;
  function findBaseElements (dom: AnyNode[]): AnyNode[] {
    return findBases(dom, options, baseSelectorsPicker);
  }

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function (dom: AnyNode[] | undefined, builder: BlockTextBuilder) {
      builder.addInline(options.limits.ellipsis || '');
    }
  ) as RecursiveCallback;

  return function (html: string | undefined, metadata: unknown = undefined): string {
    return process(html, metadata, options, picker, findBaseElements, limitedWalk);
  };
}


/**
 * Convert given HTML according to preprocessed options.
 *
 * @param { string } html HTML content to convert.
 * @param { any } metadata Optional metadata for HTML document, for use in formatters.
 * @param { Options } options HtmlToText options (preprocessed).
 * @param { import('selderee').Picker<DomNode, TagDefinition> } picker
 * Tag definition picker for DOM nodes processing.
 * @param { (dom: DomNode[]) => DomNode[] } findBaseElements
 * Function to extract elements from HTML DOM
 * that will only be present in the output text.
 * @param { RecursiveCallback } walk Recursive callback.
 * @returns { string }
 */
function process (
  html: string | undefined,
  metadata: unknown,
  options: Options,
  picker: TagPicker,
  findBaseElements: (dom: AnyNode[]) => AnyNode[],
  walk: RecursiveCallback
): string {
  const maxInputLength = options.limits.maxInputLength;
  const inputHtml = html ?? '';
  if (maxInputLength && inputHtml && inputHtml.length > maxInputLength) {
    console.warn(
      `Input length ${inputHtml.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`
    );
    html = inputHtml.substring(0, maxInputLength);
  }

  const document = parseDocument(html ?? '', { decodeEntities: options.decodeEntities });
  const bases = findBaseElements(document.children);
  const builder = new BlockTextBuilder(options, picker, metadata);
  walk(bases, builder);
  return builder.toString();
}


function findBases (dom: AnyNode[], options: Options, baseSelectorsPicker: Picker<AnyNode, number>): AnyNode[] {
  const results: Array<{ selectorIndex: number; element: AnyNode }> = [];

  function recursiveWalk (walk: (dom: AnyNode[]) => void, dom: AnyNode[]) {
    dom = dom.slice(0, options.limits.maxChildNodes) as AnyNode[];
    for (const elem of dom) {
      if (elem.type !== 'tag') {
        continue;
      }
      const pickedSelectorIndex = baseSelectorsPicker.pick1(elem);
      if (pickedSelectorIndex > 0) {
        results.push({ selectorIndex: pickedSelectorIndex, element: elem });
      } else if (elem.children) {
        walk(elem.children as AnyNode[]);
      }
      if (results.length >= options.limits.maxBaseElements) {
        return;
      }
    }
  }

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk
  ) as (dom: AnyNode[]) => void;
  limitedWalk(dom);

  if (options.baseElements.orderBy !== 'occurrence') { // 'selectors'
    results.sort((a, b) => a.selectorIndex - b.selectorIndex);
  }
  return (options.baseElements.returnDomByDefault && results.length === 0)
    ? dom
    : results.map(x => x.element);
}

/**
 * Function to walk through DOM nodes and accumulate their string representations.
 *
 * @param   { RecursiveCallback } walk    Recursive callback.
 * @param   { DomNode[] }         [dom]   Nodes array to process.
 * @param   { BlockTextBuilder }  builder Passed around to accumulate output text.
 * @private
 */
function recursiveWalk (walk: RecursiveCallback, dom: AnyNode[] | undefined, builder: BlockTextBuilder): void {
  if (!dom) { return; }

  const options = builder.options;

  const tooManyChildNodes = dom.length > options.limits.maxChildNodes;
  if (tooManyChildNodes) {
    dom = dom.slice(0, options.limits.maxChildNodes) as AnyNode[];
    dom.push({
      data: options.limits.ellipsis,
      type: 'text'
    } as AnyNode);
  }

  for (const elem of dom) {
    switch (elem.type) {
      case 'text': {
        builder.addInline((elem as any).data);
        break;
      }
      case 'tag': {
        const tagDefinition = builder.picker.pick1(elem as any) as TagDefinition;
        const format = options.formatters[tagDefinition.format] as any;
        format(elem, walk, builder, tagDefinition.options || {});
        break;
      }
      default:
        /* do nothing */
        break;
    }
  }

  return;
}

/**
 * @param { {[key: string]: string | false} } dict
 * A dictionary where keys are characters to replace
 * and values are replacement strings.
 *
 * First code point from dict keys is used.
 * Compound emojis with ZWJ are not supported (not until Node 16).
 *
 * @returns { ((str: string) => string) | undefined }
 */
function makeReplacerFromDict (dict: Record<string, string | false> | undefined): ((str: string) => string) | undefined {
  if (!dict || Object.keys(dict).length === 0) {
    return undefined;
  }
  /** @type { [string, string][] } */
  const entries = Object.entries(dict).filter(([, v]) => v !== false) as Array<[string, string]>;
  const regex = new RegExp(
    entries
      .map(([c]) => `(${unicodeEscape([...c][0])})`)
      .join('|'),
    'g'
  );
  const values = entries.map(([, v]) => v);
  const replacer = (...args: any[]) => values[args.slice(1).findIndex((cg: unknown) => cg)];
  return (str: string) => str.replace(regex, replacer);
}


export { compile };
