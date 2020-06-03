var includes = require('lodash/includes');
var trimEnd = require('lodash/trimEnd');
var htmlparser = require('htmlparser2');

var helper = require('./helper');
var defaultFormat = require('./formatter');

// Which type of tags should not be parsed
var SKIP_TYPES = [
  'style',
  'script'
];

var DEFAULT_OPTIONS = {
  baseElement: 'body',
  decodeOptions: { isAttributeValue: false, strict: false },
  format: {},
  hideLinkHrefIfSameAsText: false,
  ignoreHref: false,
  ignoreImage: false,
  linkHrefBaseUrl: null,
  longWordSplit: { wrapCharacters: [], forceWrapOnLimit: false },
  noAnchorUrl: true,
  noLinkBrackets: false,
  preserveNewlines: false,
  returnDomByDefault: true,
  singleNewLineParagraphs: false,
  tables: [],
  unorderedListItemPrefix: ' * ',
  uppercaseHeadings: true,
  wordwrap: 80,
  limits: {
    maxChildNodes: undefined,
    maxDepth: undefined,
    ellipsis: '...'
  }
};

function htmlToText(html, options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options || {});

  var handler = new htmlparser.DefaultHandler(function (error, dom) {

  }, {
    verbose: true
  });
  new htmlparser.Parser(handler).parseComplete(html);

  options.lineCharCount = 0;

  var limitedWalk = helper.limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function (dom, options, result) { return result + (options.limits.ellipsis || ''); }
    );

  var result = '';
  var baseElements = Array.isArray(options.baseElement) ? options.baseElement : [options.baseElement];
  baseElements.forEach(baseElement => {
    result += limitedWalk(findBase(handler.dom, options, baseElement), options);
  });

  return trimEnd(result);
}

function findBase(dom, options, baseElement) {
  var result = null;

  var splitTag = helper.splitCssSearchTag(baseElement);

  function recursiveWalk(walk, dom) {
    if (result) return;
    dom = dom.slice(0, options.limits.maxChildNodes);
    dom.forEach(function(elem) {
      if (result) return;
      if (elem.name === splitTag.element) {
        var documentClasses = elem.attribs && elem.attribs.class ? elem.attribs.class.split(" ") : [];
        var documentIds = elem.attribs && elem.attribs.id ? elem.attribs.id.split(" ") : [];

        if ((splitTag.classes.every(function (val) { return documentClasses.indexOf(val) >= 0; })) &&
          (splitTag.ids.every(function (val) { return documentIds.indexOf(val) >= 0; }))) {
          result = [elem];
          return;
        }
      }
      if (elem.children) { walk(elem.children); }
    });
  }

  var limitedWalk = helper.limitedDepthRecursive(
    options.limits.maxDepth,
    recursiveWalk,
    function () { }
    );

  limitedWalk(dom);
  return options.returnDomByDefault ? result || dom : result;
}

function containsTable(attr, tables) {
  if (tables === true) return true;

  function removePrefix(key) {
    return key.substr(1);
  }
  function checkPrefix(prefix) {
    return function(key) {
      return key.startsWith(prefix);
    };
  }
  function filterByPrefix(tables, prefix) {
    return tables
      .filter(checkPrefix(prefix))
      .map(removePrefix);
  }
  var classes = filterByPrefix(tables, '.');
  var ids = filterByPrefix(tables, '#');
  return attr && (includes(classes, attr['class']) || includes(ids, attr['id']));
}

function recursiveWalk(walk, dom, options, result = undefined) {
  if (result === undefined) {
    result = '';
  }
  var whiteSpaceRegex = /\s$/;
  var format = Object.assign({}, defaultFormat, options.format);

  if (!dom) {
    return result;
  }

  var tooManyChildNodes = dom.length > options.limits.maxChildNodes;
  if (tooManyChildNodes)
  {
    dom = dom.slice(0, options.limits.maxChildNodes);
  }

  dom.forEach(function(elem) {
    switch(elem.type) {
      case 'tag':
        switch(elem.name.toLowerCase()) {
          case 'img':
            result += format.image(elem, options);
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
          case 'pre':
            var newOptions = Object.assign({}, options);
            newOptions.isInPre = true;
            result += format.paragraph(elem, walk, newOptions);
            break;
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
          result += format.text(elem, options);
        }
        break;
      default:
        if (!includes(SKIP_TYPES, elem.type)) {
          result = walk(elem.children || [], options, result);
        }
    }

    options.lineCharCount = result.length - (result.lastIndexOf('\n') + 1);
  });

  if (tooManyChildNodes && options.limits.ellipsis) {
    result += options.limits.ellipsis;
  }
  return result;
}

exports.fromString = function(str, options) {
  return htmlToText(str, options || {});
};
