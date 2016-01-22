var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var _s = require('underscore.string');
var htmlparser = require('htmlparser');

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
		hideLinkHrefIfSameAsText: false,
		linkHrefBaseUrl: null
	});

	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		
	}, {
		verbose: true,
		ignoreWhitespace: true
	});
	new htmlparser.Parser(handler).parseComplete(html);
	
	var result = walk(filterBody(handler.dom), options);
	return _s.strip(result);
}

function filterBody(dom) {
	var result = null;
	function walk(dom) {
		if (result) return;
		_.each(dom, function(elem) {
			if (elem.name === 'body') {
				result = elem.children;
				return;
			}
			if (elem.children) walk(elem.children);
		});
	}
	walk(dom);
	return result || dom;
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
	var whiteSpaceRegex = /\S$/;
	_.each(dom, function(elem) {
		switch(elem.type) {
			case 'tag':
				switch(elem.name.toLowerCase()) {
					case 'img':
						result += format.image(elem, options);
						break;
					case 'a':
						// Inline element needs a leading space if `result` currently
						// doesn't end with whitespace
						elem.needsSpace = whiteSpaceRegex.test(result);
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
						if (containsTable(elem.attribs, options.tables)) {
							result += format.table(elem, walk, options);
							break;
						}
					default:
						result = walk(elem.children || [], options, result);
				}
				break;
			case 'text':
				if (elem.raw !== '\r\n') {
					// Text needs a leading space if `result` currently
					// doesn't end with whitespace
					elem.needsSpace = whiteSpaceRegex.test(result);
					result += format.text(elem, options);
				}
				break;
			default:
				if (!_.include(SKIP_TYPES, elem.type)) {
					result = walk(elem.children || [], options, result);
				}
		}
	});
	return result;
}

exports.fromFile = function(file, options, callback) {
	if (!callback) {
		callback = options;
		options = {};
	}
	fs.readFile(file, 'utf8', function(err, str) {
		var result = htmlToText(str, options);
		return callback(null, result);
	});
};

exports.fromString = function(str, options) {
	return htmlToText(str, options || {});
};
