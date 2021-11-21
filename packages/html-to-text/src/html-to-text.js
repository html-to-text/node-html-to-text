
const { compile: compile_ } = require('@html-to-text/base');
const { get } = require('@html-to-text/base/src/util');
const merge = require('deepmerge'); // default

const defaultFormatters = require('./text-formatter');


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
  decodeEntities: true,
  encodeCharacters: {},
  formatters: {},
  limits: {
    ellipsis: '...',
    maxBaseElements: undefined,
    maxChildNodes: undefined,
    maxDepth: undefined,
    maxInputLength: (1 << 24) // 16_777_216
  },
  longWordSplit: {
    forceWrapOnLimit: false,
    wrapCharacters: []
  },
  preserveNewlines: false,
  selectors: [
    { selector: '*', format: 'inline' },
    {
      selector: 'a',
      format: 'anchor',
      options: {
        baseUrl: null,
        hideLinkHrefIfSameAsText: false,
        ignoreHref: false,
        linkBrackets: ['[', ']'],
        noAnchorUrl: true
      }
    },
    { selector: 'article', format: 'block' },
    { selector: 'aside', format: 'block' },
    {
      selector: 'blockquote',
      format: 'blockquote',
      options: { leadingLineBreaks: 2, trailingLineBreaks: 2, trimEmptyLines: true }
    },
    { selector: 'br', format: 'lineBreak' },
    { selector: 'div', format: 'block' },
    { selector: 'footer', format: 'block' },
    { selector: 'form', format: 'block' },
    { selector: 'h1', format: 'heading', options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: 'h2', format: 'heading', options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: 'h3', format: 'heading', options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: 'h4', format: 'heading', options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: 'h5', format: 'heading', options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: 'h6', format: 'heading', options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: 'header', format: 'block' },
    {
      selector: 'hr',
      format: 'horizontalLine',
      options: { leadingLineBreaks: 2, length: undefined, trailingLineBreaks: 2 }
    },
    {
      selector: 'img',
      format: 'image',
      options: { baseUrl: null, linkBrackets: ['[', ']'] }
    },
    { selector: 'main', format: 'block' },
    { selector: 'nav', format: 'block' },
    {
      selector: 'ol',
      format: 'orderedList',
      options: { leadingLineBreaks: 2, trailingLineBreaks: 2 }
    },
    { selector: 'p', format: 'paragraph', options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    { selector: 'pre', format: 'pre', options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    { selector: 'section', format: 'block' },
    {
      selector: 'table',
      format: 'table',
      options: {
        colSpacing: 3,
        leadingLineBreaks: 2,
        maxColumnWidth: 60,
        rowSpacing: 0,
        trailingLineBreaks: 2,
        uppercaseHeaderCells: true
      }
    },
    {
      selector: 'ul',
      format: 'unorderedList',
      options: { itemPrefix: ' * ', leadingLineBreaks: 2, trailingLineBreaks: 2 }
    },
    { selector: 'wbr', format: 'wbr' },
  ],
  tables: [], // deprecated
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
 * @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
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

  handleDeprecatedOptions(options);

  return compile_(options);
}

/**
 * Convert given HTML content to plain text string.
 *
 * @param   { string }  html           HTML content to convert.
 * @param   { Options } [options = {}] HtmlToText options.
 * @param   { any }     [metadata]     Optional metadata for HTML document, for use in formatters.
 * @returns { string }                 Plain text string.
 * @static
 *
 * @example
 * const { convert } = require('html-to-text');
 * const text = convert('<h1>Hello World</h1>', {
 *   wordwrap: 130
 * });
 * console.log(text); // HELLO WORLD
 */
function convert (html, options = {}, metadata = undefined) {
  return compile(options)(html, metadata);
}

/**
 * Map previously existing and now deprecated options to the new options layout.
 * This is a subject for cleanup in major releases.
 *
 * @param { Options } options HtmlToText options.
 */
function handleDeprecatedOptions (options) {
  const selectorDefinitions = options.selectors;

  if (options.tags) {
    const tagDefinitions = Object.entries(options.tags).map(
      ([selector, definition]) => ({ ...definition, selector: selector || '*' })
    );
    selectorDefinitions.push(...tagDefinitions);
  }

  function set (obj, path, value) {
    const valueKey = path.pop();
    for (const key of path) {
      let nested = obj[key];
      if (!nested) {
        nested = {};
        obj[key] = nested;
      }
      obj = nested;
    }
    obj[valueKey] = value;
  }

  if (options['baseElement']) {
    const baseElement = options['baseElement'];
    set(
      options,
      ['baseElements', 'selectors'],
      (Array.isArray(baseElement) ? baseElement : [baseElement])
    );
  }
  if (options['returnDomByDefault'] !== undefined) {
    set(options, ['baseElements', 'returnDomByDefault'], options['returnDomByDefault']);
  }

  for (const definition of selectorDefinitions) {
    if (definition.format === 'anchor' && get(definition, ['options', 'noLinkBrackets'])) {
      set(definition, ['options', 'linkBrackets'], false);
    }
  }
}

module.exports = {
  compile: compile,
  convert: convert,
  htmlToText: convert
};
