
const { compile: compile_ } = require('@html-to-text/base');
const merge = require('deepmerge'); // default

const defaultFormatters = require('./md-formatter');

// eslint-disable-next-line import/no-unassigned-import
require('@html-to-text/base/src/typedefs');


/**
 * Default options.
 *
 * @constant
 * @type { Options }
 * @default
 * @private
 */
const DEFAULT_OPTIONS = {
  baseElements: {
    selectors: [ 'body' ],
    orderBy: 'selectors', // 'selectors' | 'occurrence'
    returnDomByDefault: true
  },
  decodeEntities: false,
  // TODO: encodeCharacters: { 'c': '\\c' },
  // \   backslash
  // `   backtick
  // \*  asterisk
  // _   underscore
  // {}  curly braces
  // []  square brackets
  // ()  parentheses
  // #   hash mark
  // +   plus sign
  // -   minus sign (hyphen)
  // .   dot
  // \!  exclamation mark
  formatters: {},
  limits: {
    ellipsis: '...',
    maxBaseElements: undefined,
    maxChildNodes: undefined,
    maxDepth: undefined,
    maxInputLength: (1 << 24) // 16_777_216
  },
  selectors: [
    { selector: '*', format: 'inline' },
    { selector: 'a', format: 'anchor', options: { baseUrl: null, noAnchorUrl: true } },
    { selector: 'article', format: 'block' },
    { selector: 'aside', format: 'block' },
    { selector: 'b', format: 'inlineWrap', options: { prefix: '**', suffix: '**' } },
    { selector: 'blockquote', format: 'blockquote', options: { trimEmptyLines: true } },
    { selector: 'br', format: 'inlineString', options: { string: '<br>\n' } },
    { selector: 'code', format: 'inlineWrap', options: { prefix: '`', suffix: '`' } },
    { selector: 'del', format: 'inlineWrap', options: { prefix: '~~', suffix: '~~' } },
    { selector: 'div', format: 'block' },
    { selector: 'dl', format: 'definitionListCompatible' },
    { selector: 'em', format: 'inlineWrap', options: { prefix: '*', suffix: '*' } },
    { selector: 'figure', format: 'block' },
    { selector: 'figcaption', format: 'block' },
    { selector: 'footer', format: 'block' },
    { selector: 'form', format: 'block' },
    { selector: 'h1', format: 'heading', options: { level: 1 } },
    { selector: 'h2', format: 'heading', options: { level: 2 } },
    { selector: 'h3', format: 'heading', options: { level: 3 } },
    { selector: 'h4', format: 'heading', options: { level: 4 } },
    { selector: 'h5', format: 'heading', options: { level: 5 } },
    { selector: 'h6', format: 'heading', options: { level: 6 } },
    { selector: 'header', format: 'block' },
    { selector: 'hr', format: 'blockString', options: { string: '----' } },
    { selector: 'i', format: 'inlineWrap', options: { prefix: '*', suffix: '*' } },
    { selector: 'img', format: 'image', options: { baseUrl: null } },
    { selector: 'kbd', format: 'inlineTag' },
    { selector: 'main', format: 'block' },
    { selector: 'nav', format: 'block' },
    { selector: 'ol', format: 'orderedList', options: { interRowLineBreaks: 1 } },
    { selector: 'p', format: 'block' },
    { selector: 'picture', format: 'inline' },
    { selector: 'pre', format: 'pre' },
    { selector: 's', format: 'inlineWrap', options: { prefix: '~~', suffix: '~~' } },
    { selector: 'section', format: 'block' },
    { selector: 'source', format: 'skip' },
    { selector: 'strong', format: 'inlineWrap', options: { prefix: '**', suffix: '**' } },
    { selector: 'sub', format: 'inlineTag' },
    { selector: 'sup', format: 'inlineTag' },
    { selector: 'table', format: 'dataTable' },
    { selector: 'ul', format: 'unorderedList', options: { marker: '-', interRowLineBreaks: 1 } },
    { selector: 'wbr', format: 'wbr' },
  ],
  whitespaceCharacters: ' \t\r\n\f\u200b',
  wordwrap: 80
};


const concatMerge = (acc, src, options) => [...acc, ...src];
const overwriteMerge = (acc, src, options) => [...src];
const selectorsMerge = (acc, src, options) => (
  (acc.some(s => typeof s === 'object'))
    ? concatMerge(acc, src, options) // selectors
    : overwriteMerge(acc, src, options) // baseElements.selectors
);

/**
 * Preprocess options, compile selectors into a decision tree,
 * return a function intended for batch processing.
 *
 * @param   { Options } [options = {}]   HtmlToText options.
 * @returns { (html: string) => string } Pre-configured converter function.
 * @static
 */
function compile (options = {}) {
  options = merge(
    DEFAULT_OPTIONS,
    options,
    {
      arrayMerge: overwriteMerge,
      customMerge: (key) => ((key === 'selectors') ? selectorsMerge : undefined)
    }
  );
  options.formatters = Object.assign({}, defaultFormatters, options.formatters);

  return compile_(options);
}

/**
 * Convert given HTML content to a markdown string.
 *
 * @param   { string }  html           HTML content to convert.
 * @param   { Options } [options = {}] HtmlToText options.
 * @returns { string }                 Plain text string.
 * @static
 *
 * @example
 * const { convert } = require('html-to-text');
 * const text = convert('<h1>Hello World</h1>', {});
 * console.log(text); // # Hello World
 */
function convert (html, options = {}) {
  return compile(options)(html);
}

module.exports = {
  compile: compile,
  convert: convert,
  htmlToMarkdown: convert
};
