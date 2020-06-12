const htmlparser = require('htmlparser2');
const trimEnd = require('lodash/trimEnd');

const defaultFormat = require('./formatter');
const { limitedDepthRecursive, splitCssSearchTag } = require('./helper');
// eslint-disable-next-line import/no-unassigned-import
require('./typedefs');


// Which type of tags should not be parsed
const SKIP_TYPES = [
  'style',
  'script'
];

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
  options = Object.assign({}, DEFAULT_OPTIONS, options || {});

  const handler = new htmlparser.DefaultHandler(
    function () { /* do nothing */ },
    { verbose: true }
  );
  new htmlparser.Parser(handler).parseComplete(html);

  options.lineCharCount = 0;

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function (dom, options, result) { return result + (options.limits.ellipsis || ''); }
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

function containsTable (attr, tables) {
  if (tables === true) { return true; }

  function removePrefix (key) {
    return key.substr(1);
  }
  function checkPrefix (prefix) {
    return function (key) {
      return key.startsWith(prefix);
    };
  }
  function filterByPrefix (tables, prefix) {
    return tables
      .filter(checkPrefix(prefix))
      .map(removePrefix);
  }
  const classes = filterByPrefix(tables, '.');
  const ids = filterByPrefix(tables, '#');
  return attr && (classes.includes(attr['class']) || ids.includes(attr['id']));
}

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
  const whiteSpaceRegex = /\s$/;
  const format = Object.assign({}, defaultFormat, options.format);

  if (!dom) {
    return result;
  }

  const tooManyChildNodes = dom.length > options.limits.maxChildNodes;
  if (tooManyChildNodes) {
    dom = dom.slice(0, options.limits.maxChildNodes);
  }

  for (const elem of dom) {
    switch (elem.type) {
      case 'tag':
        switch (elem.name.toLowerCase()) {
          case 'img':
            result += format.image(elem, null, options);
            break;
          case 'a':
            // Inline element needs its leading space to be trimmed if `result`
            // currently ends with whitespace
            elem.trimLeadingSpace = whiteSpaceRegex.test(result);
            result += format.anchor(elem, walk, options);
            break;
          case 'p':
            result += format.paragraph(elem, walk, options);
            break;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            result += format.heading(elem, walk, options);
            break;
          case 'br':
            result += format.lineBreak(elem, walk, options);
            break;
          case 'hr':
            result += format.horizontalLine(elem, walk, options);
            break;
          case 'ul':
            result += format.unorderedList(elem, walk, options);
            break;
          case 'ol':
            result += format.orderedList(elem, walk, options);
            break;
          case 'pre': {
            const newOptions = Object.assign({}, options);
            newOptions.isInPre = true;
            result += format.paragraph(elem, walk, newOptions);
            break;
          }
          case 'table':
            result = containsTable(elem.attribs, options.tables)
              ? result + format.table(elem, walk, options)
              : walk(elem.children || [], options, result);
            break;
          case 'blockquote':
            result += format.blockquote(elem, walk, options);
            break;
          default:
            result = walk(elem.children || [], options, result);
        }
        break;
      case 'text':
        if (elem.data !== '\r\n') {
          // Text needs its leading space to be trimmed if `result`
          // currently ends with whitespace
          elem.trimLeadingSpace = whiteSpaceRegex.test(result);
          result += format.text(elem, null, options);
        }
        break;
      default:
        if (!SKIP_TYPES.includes(elem.type)) {
          result = walk(elem.children || [], options, result);
        }
    }

    options.lineCharCount = result.length - (result.lastIndexOf('\n') + 1);
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
