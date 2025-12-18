import type { BlockTextBuilder } from './lib/block-text-builder';


export type compiledFunction = (str: string) => string;
export type metaData = any;

/**
 * Preprocess options, compile selectors into a decision tree,
 * return a function intended for batch processing.
 */
export declare function compile(options?: HtmlToTextOptions): compiledFunction;

/**
 * Convert given HTML content to plain text string.
 *
 * @example
 * const { htmlToText } = require('html-to-text');
 * const text = htmlToText('<h1>Hello World</h1>', {
 *   wordwrap: 130
 * });
 * console.log(text); // HELLO WORLD
 */
export declare function htmlToText(html: string, options?: HtmlToTextOptions, metadata?: metaData): string;
export { htmlToText as convert };

export interface HtmlToTextOptions {
  /**
   * Options for narrowing down to informative parts of HTML document.
   */
  baseElements?: BaseElementsOptions | undefined;
  /**
   * Decode HTML entities found in the input HTML if true.
   * Otherwise preserve in output text.
   */
  decodeEntities?: boolean | undefined;
  /**
   * A dictionary with characters that should be replaced in the output
   * text and corresponding escape sequences.
   */
  encodeCharacters?: Record<string, string | false> | ((str: string) => string) | undefined;
  /**
   * A dictionary with custom formatting functions for specific kinds of elements.
   *
   * Keys are custom string identifiers, values are callbacks.
   */
  formatters?: Record<string, FormatCallback> | undefined;
  /**
   * Options for handling complex documents and limiting the output size.
   */
  limits?: LimitsOptions | undefined;
  /**
   * Describes how to wrap long words.
   */
  longWordSplit?: LongWordSplitOptions | undefined;
  /**
   * By default, any newlines `\n` from the input HTML are dropped.
   *
   * If `true`, these newlines will be preserved in the output.
   */
  preserveNewlines?: boolean | undefined;
  /**
   * Instructions for how to render HTML elements based on matched selectors.
   *
   * Use this to (re)define options for new or already supported tags.
   */
  selectors?: SelectorDefinition[] | undefined;
  /**
   * All characters that are considered whitespace.
   * Default is according to HTML specifications.
   */
  whitespaceCharacters?: string | undefined;
  /**
   * After how many chars a line break should follow in `p` elements.
   *
   * Set to `null` or `false` to disable word-wrapping.
   */
  wordwrap?: number | false | null | undefined;

  /**
   * The following are deprecated options. See the documentation.
   */

  /**
   * @deprecated Use baseElements.selectors instead.
   */
  baseElement?: string | string[] | undefined;
  /**
   * @deprecated Use baseElements instead.
   */
  returnDomByDefault?: boolean | undefined;
  /**
   * @deprecated Use selectors with `format: 'dataTable'` instead.
   */
  tables?: string[] | boolean | undefined;
  /**
   * @deprecated Use selectors instead.
   */
  tags?: TagDefinitions | undefined;
}

/**
 * Options for narrowing down to informative parts of HTML document.
 */
export interface BaseElementsOptions {
  /**
   * The resulting text output will be composed from the text content of elements
   * matched with these selectors.
   */
  selectors?: string[] | undefined;
  /**
   * When multiple selectors are set, this option specifies
   * whether the selectors order has to be reflected in the output text.
   *
   * `'selectors'` (default) - matches for the first selector will appear first, etc;
   *
   * `'occurrence'` - all bases will appear in the same order as in input HTML.
   */
  orderBy?: 'selectors' | 'occurrence' | undefined;
  /**
   * Use the entire document if none of provided selectors matched.
   */
  returnDomByDefault?: boolean | undefined;
}

/**
 * Options for handling complex documents and limiting the output size.
 */
export interface LimitsOptions {
  /**
   * A string to put in place of skipped content.
   */
  ellipsis?: string | undefined;
  /**
   * Stop looking for more base elements after reaching this amount.
   *
   * Unlimited if undefined.
   */
  maxBaseElements?: number | undefined;
  /**
   * Maximum number of child nodes of a single node to be added to the
   * output. Unlimited if undefined.
   */
  maxChildNodes?: number | undefined;
  /**
   * Only go to a certain depth starting from `Options.baseElement`.
   *
   * Replace deeper nodes with ellipsis.
   *
   * No depth limit if undefined.
   */
  maxDepth?: number | undefined;
  /**
   * If the input string is longer than this value - it will be truncated
   * and a message will be sent to `stderr`.
   *
   * Ellipsis is not used in this case.
   */
  maxInputLength?: number | undefined;
}

/**
 * Describes how to wrap long words.
 */
export interface LongWordSplitOptions {
  /**
   * Break long words on the `Options.wordwrap` limit when there are no characters to wrap on.
   */
  forceWrapOnLimit?: boolean | undefined;
  /**
   * An array containing the characters that may be wrapped on.
   */
  wrapCharacters?: string[] | undefined;
}

/**
 * Describes how to handle tags matched by a selector.
 */
export interface SelectorDefinition {
  /**
   * CSS selector. Refer to README for notes on supported selectors etc.
   */
  selector: string;
  /**
   * Identifier of a {@link FormatCallback}, built-in or provided in `Options.formatters` dictionary.
   */
  format?: string | undefined;
  /**
   * Options to customize the formatter for this tag.
   */
  options?: FormatOptions | undefined;
}

/**
 * Describes how to handle a tag.
 */
export interface TagDefinition {
  /**
   * Identifier of a {@link FormatCallback}, built-in or provided in `Options.formatters` dictionary.
   */
  format?: string | undefined;
  /**
   * Options to customize the formatter for this tag.
   */
  options?: FormatOptions | undefined;
}

/**
 * Options specific to different formatters ({@link FormatCallback}).
 * This is an umbrella type definition. Each formatter supports it's own subset of options.
 */
export interface FormatOptions {
  leadingLineBreaks?: number | undefined;
  trailingLineBreaks?: number | undefined;

  baseUrl?: string | undefined;
  linkBrackets?: [string, string] | false | undefined;
  pathRewrite?: ((path: string, meta: metaData) => string) | undefined;
  hideLinkHrefIfSameAsText?: boolean | undefined;
  ignoreHref?: boolean | undefined;
  noAnchorUrl?: boolean | undefined;
  itemPrefix?: string | undefined;
  uppercase?: boolean | undefined;
  length?: number | undefined;
  trimEmptyLines?: boolean | undefined;
  uppercaseHeaderCells?: boolean | undefined;
  maxColumnWidth?: number | undefined;
  colSpacing?: number | undefined;
  rowSpacing?: number | undefined;
  string?: string | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;

  /**
   * @deprecated Use linkBrackets instead.
   * (Only for: `anchor` formatter.) Don't print brackets around links.
   */
  noLinkBrackets?: boolean | undefined;

  /**
   * User defined values are supported.
   */
  [key: string]: any;
}

/**
 * Simplified definition of [htmlparser2](https://github.com/fb55/htmlparser2) Node type.
 */
export interface DomNode {
  /**
   * Type of node - "text", "tag", "comment", "script", etc.
   */
  type: string;
  /**
   * Content of a data node.
   */
  data?: string | undefined;
  /**
   * Tag name.
   */
  name?: string | undefined;
  /**
   * Tag attributes dictionary.
   */
  attribs?: any;
  /**
   * Child nodes.
   * Not optional for typescript use.
   */
  children: DomNode[];
  /**
   * Parent node.
   */
  parent?: DomNode | undefined;
}

/**
 * A function to stringify a DOM node.
 */
export type FormatCallback = (
  elem: DomNode,
  walk: RecursiveCallback,
  builder: BlockTextBuilder,
  formatOptions: FormatOptions
) => void;

/**
 * A function to process child nodes.
 * Passed into a {@link FormatCallback} as an argument.
 */
export type RecursiveCallback = (nodes: DomNode[], builder: BlockTextBuilder) => void;

/**
 * Type of object passed to tags in the options.
 */
export interface TagDefinitions {
  [key: string]: TagDefinition | undefined;
}
