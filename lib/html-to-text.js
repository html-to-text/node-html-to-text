const merge = require('deepmerge');
const he = require('he');
const htmlparser = require('htmlparser2');

const { BlockTextBuilder } = require('./block-text-builder');
const defaultFormatters = require('./formatter');
const { limitedDepthRecursive, set, splitSelector } = require('./helper');

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
  formatters: {},
  limits: {
    ellipsis: '...',
    maxChildNodes: undefined,
    maxDepth: undefined,
    maxInputLength: (1 << 24) // 16_777_216
  },
  longWordSplit: {
    forceWrapOnLimit: false,
    wrapCharacters: []
  },
  preserveNewlines: false,
  returnDomByDefault: true,
  tables: [],
  tags: {
    '': { format: 'inline' }, // defaults for any other tag name
    'a': {
      format: 'anchor',
      options: { baseUrl: null, hideLinkHrefIfSameAsText: false, ignoreHref: false, noAnchorUrl: true, noLinkBrackets: false }
    },
    'article': { format: 'block' },
    'aside': { format: 'block' },
    'blockquote': {
      format: 'blockquote',
      options: { leadingLineBreaks: 2, trailingLineBreaks: 2, trimEmptyLines: true }
    },
    'br': { format: 'lineBreak' },
    'div': { format: 'block' },
    'footer': { format: 'block' },
    'form': { format: 'block' },
    'h1': { format: 'heading', options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    'h2': { format: 'heading', options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    'h3': { format: 'heading', options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    'h4': { format: 'heading', options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    'h5': { format: 'heading', options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    'h6': { format: 'heading', options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    'header': { format: 'block' },
    'hr': { format: 'horizontalLine', options: { leadingLineBreaks: 2, length: undefined, trailingLineBreaks: 2 } },
    'img': { format: 'image', options: { baseUrl: null } },
    'main': { format: 'block' },
    'nav': { format: 'block' },
    'ol': { format: 'orderedList', options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    'p': { format: 'paragraph', options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    'pre': { format: 'pre', options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    'section': { format: 'block' },
    'table': {
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
    'ul': {
      format: 'unorderedList',
      options: { itemPrefix: ' * ', leadingLineBreaks: 2, trailingLineBreaks: 2 }
    },
    'wbr': { format: 'wbr' }
  },
  whitespaceCharacters: ' \t\r\n\f\u200b',
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
 * const text = htmlToText('<h1>Hello World</h1>', {
 *   wordwrap: 130
 * });
 * console.log(text); // HELLO WORLD
 */
function htmlToText (html, options = {}) {
  options = merge(
    DEFAULT_OPTIONS,
    options,
    { arrayMerge: (destinationArray, sourceArray, mergeOptions) => sourceArray }
  );
  options.formatters = Object.assign({}, defaultFormatters, options.formatters);

  handleDeprecatedOptions(options);

  const maxInputLength = options.limits.maxInputLength;
  if (maxInputLength && html && html.length > maxInputLength) {
    console.warn(
      `Input length ${html.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`
    );
    html = html.substring(0, maxInputLength);
  }

  const handler = new htmlparser.DefaultHandler();
  new htmlparser.Parser(handler, { decodeEntities: false }).parseComplete(html);

  const limitedWalk = limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function (dom, builder) {
      builder.addInline(options.limits.ellipsis || '');
    }
  );

  const baseElements = Array.isArray(options.baseElement)
    ? options.baseElement
    : [options.baseElement];
  const bases = baseElements
    .map(be => findBase(handler.dom, options, be))
    .filter(b => b)
    .reduce((acc, b) => acc.concat(b), []);

  const builder = new BlockTextBuilder(options);
  limitedWalk(bases, builder);
  return builder.toString();
}

/**
 * Map previously existing and now deprecated options to the new options layout.
 * This is a subject for cleanup in major releases.
 *
 * @param { Options } options HtmlToText options.
 */
function handleDeprecatedOptions (options) {
  const tagDefinitions = Object.values(options.tags);

  function copyFormatterOption (source, format, target) {
    if (options[source] === undefined) { return; }
    for (const tagDefinition of tagDefinitions) {
      if (tagDefinition.format === format) {
        set(tagDefinition, ['options', target], options[source]);
      }
    }
  }

  copyFormatterOption('hideLinkHrefIfSameAsText', 'anchor', 'hideLinkHrefIfSameAsText');
  copyFormatterOption('ignoreHref', 'anchor', 'ignoreHref');
  copyFormatterOption('linkHrefBaseUrl', 'anchor', 'baseUrl');
  copyFormatterOption('noAnchorUrl', 'anchor', 'noAnchorUrl');
  copyFormatterOption('noLinkBrackets', 'anchor', 'noLinkBrackets');

  copyFormatterOption('linkHrefBaseUrl', 'image', 'baseUrl');

  copyFormatterOption('unorderedListItemPrefix', 'unorderedList', 'itemPrefix');

  copyFormatterOption('uppercaseHeadings', 'heading', 'uppercase');
  copyFormatterOption('uppercaseHeadings', 'table', 'uppercaseHeadings');
  copyFormatterOption('uppercaseHeadings', 'dataTable', 'uppercaseHeadings');

  if (options['ignoreImage']) {
    for (const tagDefinition of tagDefinitions) {
      if (tagDefinition.format === 'image') {
        tagDefinition.format = 'skip';
      }
    }
  }

  if (options['singleNewLineParagraphs']) {
    for (const tagDefinition of tagDefinitions) {
      if (tagDefinition.format === 'paragraph' || tagDefinition.format === 'pre') {
        set(tagDefinition, ['options', 'leadingLineBreaks'], 1);
        set(tagDefinition, ['options', 'trailingLineBreaks'], 1);
      }
    }
  }
}

function findBase (dom, options, baseElement) {
  let result = null;

  const splitTag = splitSelector(baseElement);

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
    recursiveWalk
  );

  limitedWalk(dom);
  return options.returnDomByDefault ? result || dom : result;
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
        builder.addInline(he.decode(elem.data, options.decodeOptions));
        break;
      }
      case 'tag': {
        const tags = options.tags;
        const tagDefinition = tags[elem.name] || tags[''];
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
