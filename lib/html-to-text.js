const merge = require('deepmerge');
const htmlparser = require('htmlparser2');
const trimEnd = require('lodash/trimEnd');
const trimStart = require('lodash/trimStart');

const defaultFormat = require('./formatter');
const { limitedDepthRecursive, splitCssSearchTag } = require('./helper');
// eslint-disable-next-line import/no-unassigned-import
require('./typedefs');


/**
 * Default options.
 *
 * @constant
 * @type { Options }
 * @default
 * @private
 */
const DEFAULT_OPTIONS = {
  baseElement: 'body',
  decodeOptions: {
    isAttributeValue: false,
    strict: false
  },
  format: {},
  hideLinkHrefIfSameAsText: false,
  ignoreHref: false,
  ignoreImage: false,
  limits: {
    ellipsis: '...',
    maxChildNodes: undefined,
    maxDepth: undefined
  },
  linkHrefBaseUrl: null,
  longWordSplit: {
    forceWrapOnLimit: false,
    wrapCharacters: []
  },
  noAnchorUrl: true,
  noLinkBrackets: false,
  preserveNewlines: false,
  returnDomByDefault: true,
  singleNewLineParagraphs: false,
  tables: [],
  tags: {
    '': { formatter: 'children' }, // defaults for any other tag name
    'a': { formatter: 'anchor', inline: true },
    'blockquote': { formatter: 'blockquote' },
    'br': { formatter: 'lineBreak' },
    'h1': { formatter: 'heading' },
    'h2': { formatter: 'heading' },
    'h3': { formatter: 'heading' },
    'h4': { formatter: 'heading' },
    'h5': { formatter: 'heading' },
    'h6': { formatter: 'heading' },
    'hr': { formatter: 'horizontalLine' },
    'img': { formatter: 'image', inline: true },
    'ol': { formatter: 'orderedList' },
    'p': { formatter: 'paragraph' },
    'pre': { formatter: 'pre' },
    'table': { formatter: 'table' },
    'ul': { formatter: 'unorderedList' }
  },
  unorderedListItemPrefix: ' * ',
  uppercaseHeadings: true,
  wordwrap: 80
};

/**
 * Convert given HTML content to plain text string.
 *
 * @param   { string }  html           HTML content to convert.
 * @param   { Options } [options = {}] HtmlToText options.
 * @returns { string }                 Plain text string.
 * @static
 *
 * @example
 * const { htmlToText } = require('html-to-text');
 * const text = htmlToText.fromString('<h1>Hello World</h1>', {
 *   wordwrap: 130
 * });
 * console.log(text); // HELLO WORLD
 */
function htmlToText (html, options = {}) {
  options = merge(
    DEFAULT_OPTIONS,
    options,
    { arrayMerge: (destinationArray, sourceArray, options) => sourceArray }
  );
  options.format = Object.assign({}, defaultFormat, options.format);

  const handler = new htmlparser.DefaultHandler();
  new htmlparser.Parser(handler, { lowerCaseTags: true }).parseComplete(html);

  options.lineCharCount = 0;

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function (dom, options, result) {
      return (result || '') + (options.limits.ellipsis || '');
    }
  );

  let result = '';
  const baseElements = Array.isArray(options.baseElement) ? options.baseElement : [options.baseElement];
  for (const baseElement of baseElements) {
    result += limitedWalk(findBase(handler.dom, options, baseElement), options);
  }

  return trimEnd(result);
}

function findBase (dom, options, baseElement) {
  let result = null;

  const splitTag = splitCssSearchTag(baseElement);

  function recursiveWalk (walk, /** @type { DomNode[] } */ dom) {
    if (result) { return; }
    dom = dom.slice(0, options.limits.maxChildNodes);
    for (const elem of dom) {
      if (result) { return; }
      if (elem.name === splitTag.element) {
        const documentClasses = elem.attribs && elem.attribs.class ? elem.attribs.class.split(' ') : [];
        const documentIds = elem.attribs && elem.attribs.id ? elem.attribs.id.split(' ') : [];

        if (
          splitTag.classes.every(function (val) { return documentClasses.indexOf(val) >= 0; }) &&
          splitTag.ids.every(function (val) { return documentIds.indexOf(val) >= 0; })
        ) {
          result = [elem];
          return;
        }
      }
      if (elem.children) { walk(elem.children); }
    }
  }

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function () { /* do nothing */ }
  );

  limitedWalk(dom);
  return options.returnDomByDefault ? result || dom : result;
}

const ENDS_WITH_WHITE_SPACE_REGEX = /\s$/;

/**
 * Function to walk through DOM nodes and accumulate their string representations.
 *
 * @param   { Function }           walk                 Recursive callback.
 * @param   { DomNode[] }          dom                  Nodes array to process.
 * @param   { Options }            options              HtmlToText options.
 * @param   { string | undefined } [result = undefined] String to add results to.
 * @returns { string }
 * @private
 */
function recursiveWalk (walk, dom, options, result = undefined) {
  if (result === undefined) {
    result = '';
  }

  if (!dom) {
    return result;
  }

  const tooManyChildNodes = dom.length > options.limits.maxChildNodes;
  if (tooManyChildNodes) {
    dom = dom.slice(0, options.limits.maxChildNodes);
  }

  const formatters = options.format;
  const tags = options.tags;

  function handleTag (elem) {
    const tagDefinition = tags[elem.name] || tags[''];
    const formatter = formatters[tagDefinition.formatter];
    return {
      isInline: !!tagDefinition.inline,
      text: formatter(elem, walk, options)
    };
  }

  function handleText (elem) {
    return {
      isInline: true,
      text: formatters.text(elem, null, options)
    };
  }

  for (const elem of dom) {
    const { isInline, text } = (elem.type === 'tag')
      ? handleTag(elem)
      : (elem.type === 'text' && elem.data !== '\r\n')
        ? handleText(elem)
        : { };

    if (text) {
      result += (isInline && ENDS_WITH_WHITE_SPACE_REGEX.test(result))
        ? trimStart(text)
        : text;
      options.lineCharCount = result.length - (result.lastIndexOf('\n') + 1);
    }
  }

  if (tooManyChildNodes && options.limits.ellipsis) {
    result += options.limits.ellipsis;
  }
  return result;
}

/**
 * @deprecated Import/require `{ htmlToText }` function instead!
 * @see htmlToText
 *
 * @param   { string }  html           HTML content to convert.
 * @param   { Options } [options = {}] HtmlToText options.
 * @returns { string }                 Plain text string.
 * @static
 */
const fromString = (html, options = {}) => htmlToText(html, options);

module.exports = {
  htmlToText: htmlToText,
  fromString: fromString
};
