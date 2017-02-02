var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var _s = require('underscore.string');
var htmlparser = require('htmlparser2');

var helper = require('./helper');
var format = require('./formatter');

// Which type of tags should not be parsed
var SKIP_TYPES = [
  'style',
  'script'
];

function htmlToText(html, options) {
  options = options || {};
  _.defaults(options, {
    wordwrap: 80,
    tables: [],
    preserveNewlines: false,
    uppercaseHeadings: true,
    singleNewLineParagraphs: false,
    hideLinkHrefIfSameAsText: false,
    linkHrefBaseUrl: null,
    noLinkBrackets: false,
    baseElement: 'body',
    returnDomByDefault: true,
    decodeOptions: {
      isAttributeValue: false,
      strict: false
    },
    longWordSplit: {
      wrapCharacters: [],
      forceWrapOnLimit: false
    }
  });

  var handler = new htmlparser.DefaultHandler(function (error, dom) {

  }, {
    verbose: true
  });
  new htmlparser.Parser(handler).parseComplete(html);

  options.lineCharCount = 0;

  var result = '';
  var baseElements = Array.isArray(options.baseElement) ? options.baseElement : [options.baseElement];
  for (var idx = 0; idx < baseElements.length; ++idx) {
    result += walk(filterBody(handler.dom, options, baseElements[idx]), options);
  }
  return _s.strip(result);
}

function filterBody(dom, options, baseElement) {
  var result = null;

  var splitTag = helper.splitCssSearchTag(baseElement);

  function walk(dom) {
    if (result) return;
    _.each(dom, function(elem) {
      if (result) return;
      if (elem.name === splitTag.element) {
        var documentClasses = elem.attribs && elem.attribs.class ? elem.attribs.class.split(" ") : [];
        var documentIds = elem.attribs && elem.attribs.id ? elem.attribs.id.split(" ") : [];

        if ((splitTag.classes.every(function (val) { return documentClasses.indexOf(val) >= 0 })) &&
          (splitTag.ids.every(function (val) { return documentIds.indexOf(val) >= 0 }))) {
          result = [elem];
          return;
        }
      }
      if (elem.children) walk(elem.children);
    });
  }
  walk(dom);
  return options.returnDomByDefault ? result || dom : result;
}

function containsTable(attr, tables) {
  if (tables === true) return true;

  function removePrefix(key) {
    return key.substr(1);
  }
  function checkPrefix(prefix) {
    return function(key) {
      return _s.startsWith(key, prefix);
    };
  }
  function filterByPrefix(tables, prefix) {
    return _(tables).chain()
      .filter(checkPrefix(prefix))
      .map(removePrefix)
      .value();
  }
  var classes = filterByPrefix(tables, '.');
  var ids = filterByPrefix(tables, '#');
  return attr && (_.include(classes, attr['class']) || _.include(ids, attr['id']));
}

function walk(dom, options, result) {
  if (arguments.length < 3) {
    result = '';
  }
  var whiteSpaceRegex = /\s$/;
  _.each(dom, function(elem) {
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
            var newOptions = _(options).clone();
            newOptions.isInPre = true;
            result += format.paragraph(elem, walk, newOptions);
            break;
          case 'table':
            result = containsTable(elem.attribs, options.tables)
              ? result + format.table(elem, walk, options)
              : walk(elem.children || [], options, result);
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
        if (!_.include(SKIP_TYPES, elem.type)) {
          result = walk(elem.children || [], options, result);
        }
    }

    options.lineCharCount = result.length - (result.lastIndexOf('\n') + 1);
  });
  return result;
}

exports.fromFile = function(file, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  fs.readFile(file, 'utf8', function (err, str) {
    if (err) return callback(err);
    return callback(null, htmlToText(str, options));
  });
};

exports.fromString = function(str, options) {
  return htmlToText(str, options || {});
};
