
const { hp2Builder } = require('@selderee/plugin-htmlparser2');
const htmlparser = require('htmlparser2');
const selderee = require('selderee');

const { BlockTextBuilder } = require('./block-text-builder');
const { limitedDepthRecursive, mergeDuplicatesPreferLast } = require('./util');


/**
 * Compile selectors into a decision tree,
 * return a function intended for batch processing.
 *
 * @param   { Options } [options = {}]   HtmlToText options (defaults, formatters, user options merged).
 * @returns { (html: string) => string } Pre-configured converter function.
 * @static
 */
function compile (options = {}) {
  const uniqueSelectors = mergeDuplicatesPreferLast(options.selectors, (s => s.selector));
  const selectorsWithoutFormat = uniqueSelectors.filter(s => !s.format);
  if (selectorsWithoutFormat.length) {
    throw new Error(
      'Following selectors have no specified format: ' +
      selectorsWithoutFormat.map(s => `\`${s.selector}\``).join(', ')
    );
  }
  const picker = new selderee.DecisionTree(
    uniqueSelectors.map(s => [s.selector, s])
  ).build(hp2Builder);

  const baseSelectorsPicker = new selderee.DecisionTree(
    options.baseElements.selectors.map((s, i) => [s, i + 1])
  ).build(hp2Builder);
  function findBaseElements (dom) {
    return findBases(dom, options, baseSelectorsPicker);
  }

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function (dom, builder) {
      builder.addInline(options.limits.ellipsis || '');
    }
  );

  return function (html) {
    return process(html, options, picker, findBaseElements, limitedWalk);
  };
}


/**
 * Convert given HTML according to preprocessed options.
 *
 * @param { string } html HTML content to convert.
 * @param { Options } options HtmlToText options (preprocessed).
 * @param { Picker<DomNode, TagDefinition> } picker
 * Tag definition picker for DOM nodes processing.
 * @param { (dom: DomNode[]) => DomNode[] } findBaseElements
 * Function to extract elements from HTML DOM
 * that will only be present in the output text.
 * @param { RecursiveCallback } walk Recursive callback.
 * @returns { string }
 */
function process (html, options, picker, findBaseElements, walk) {
  const maxInputLength = options.limits.maxInputLength;
  if (maxInputLength && html && html.length > maxInputLength) {
    console.warn(
      `Input length ${html.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`
    );
    html = html.substring(0, maxInputLength);
  }

  const handler = new htmlparser.DomHandler();
  new htmlparser.Parser(handler, { decodeEntities: options.decodeEntities }).parseComplete(html);

  const bases = findBaseElements(handler.dom);
  const builder = new BlockTextBuilder(options, picker);
  walk(bases, builder);
  return builder.toString();
}


function findBases (dom, options, baseSelectorsPicker) {
  const results = [];

  function recursiveWalk (walk, /** @type { DomNode[] } */ dom) {
    dom = dom.slice(0, options.limits.maxChildNodes);
    for (const elem of dom) {
      if (elem.type !== 'tag') {
        continue;
      }
      const pickedSelectorIndex = baseSelectorsPicker.pick1(elem);
      if (pickedSelectorIndex > 0) {
        results.push({ selectorIndex: pickedSelectorIndex, element: elem });
      } else if (elem.children) {
        walk(elem.children);
      }
      if (results.length >= options.limits.maxBaseElements) {
        return;
      }
    }
  }

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk
  );
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
function recursiveWalk (walk, dom, builder) {
  if (!dom) { return; }

  const options = builder.options;

  const tooManyChildNodes = dom.length > options.limits.maxChildNodes;
  if (tooManyChildNodes) {
    dom = dom.slice(0, options.limits.maxChildNodes);
    dom.push({
      data: options.limits.ellipsis,
      type: 'text'
    });
  }

  for (const elem of dom) {
    switch (elem.type) {
      case 'text': {
        builder.addInline(elem.data);
        break;
      }
      case 'tag': {
        const tagDefinition = builder.picker.pick1(elem);
        const format = options.formatters[tagDefinition.format];
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


module.exports = { compile: compile };
