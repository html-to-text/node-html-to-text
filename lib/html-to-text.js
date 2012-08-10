var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var _s = require('underscore.string');
var htmlparser = require("htmlparser");

var helper = require('./helper');

function htmlToText(html, options) {
	options = options || {};
	_.defaults(options, {
		wordwrap: 80,
		tables: []
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
	return result || dom;
}

function zip(array) {
	return _.zip.apply(_, array);
}

function wordwrap(text, max) {
	var result = '';
	var words = _s.words(text);
	var length = 0;
	var buffer = [];
	_.each(words, function(word) {
		if (length + word.length <= max) {
			buffer.push(word);
			// Add word length + one whitespace
			length += word.length + 1;
		} else {
			result += buffer.join(' ') + '\n';
			buffer = [word];
			length = word.length;
		}
	});
	result += buffer.join(' ');
	return _s.rstrip(result);
}

function formatText(elem, options) {
	var text = _s.strip(elem.raw);
	text = helper.decodeHTMLEntities(text);
	return wordwrap(text, options.wordwrap);
}

function formatBreak(elem, fn, options) {
	return '\n' + fn(elem.children, options);
}

function formatParagraph(elem, fn, options) {
	return fn(elem.children, options) + '\n\n';
}

function formatTitle(elem, fn, options) {
	return fn(elem.children, options).toUpperCase() + '\n';
}

function formatAnchor(elem, fn, options) {
	return elem.attribs.href.replace(/^mailto\:/, '');
}

function formatHorizontalLine(elem, fn, options) {
	return _s.repeat('-', options.wordwrap) + '\n\n';
}

function formatListEntry(prefix, elem, fn, options) {
	options = _.clone(options);
	// Reduce the wordwrap for sub elements.
	options.wordwrap -= prefix.length;
	// Process sub elements.
	var text = fn(elem.children, options);
	// Replace all line breaks with line break + prefix spacing.
	text = text.replace(/\n/g, '\n' + _s.repeat(' ', prefix.length));
	// Add first prefix and line break at the end.
	return prefix + text + '\n';
}

function formatList(elem, fn, options) {
	var result = '';
	if (elem.name === 'ul') {
		_.each(elem.children, function(elem) {
			result += formatListEntry(' * ', elem, fn, options);
		});
	} else if (elem.name === 'ol') {
		// Calculate the maximum length to i.
		var maxLength = elem.children.length.toString().length;
		_.each(elem.children, function(elem, i) {
			var index = i + 1;
			// Calculate the needed spacing for nice indentation.
			var spacing = maxLength - index.toString().length;
			var prefix = ' ' + index + '. ' + _s.repeat(' ', spacing);
			result += formatListEntry(prefix, elem, fn, options);
		});
	}
	return result + '\n';
}

function tableToString(table) {
	// Determine space width per column
	// Convert all rows to lengths
	var widths = _.map(table, function(row) {
		return _.map(row, function(col) {
			return col.length;
		});
	});
	// Invert rows with colums
	widths = zip(widths);
	// Determine the max values for each column
	widths = _.map(widths, function(col) {
		return _.max(col);
	});

	// Build the table
	var text = '';
	_.each(table, function(row) {
		var i = 0;
		_.each(row, function(col) {
			text += _s.rpad(_s.strip(col), widths[i++], ' ') + '   ';
		});
		text += '\n';
	});
	return text + '\n';
}

function formatTable(elem, fn, options) {
	var table = [];
	_.each(elem.children, function(elem) {
		if (elem.type === 'tag' && elem.name === 'tr') {
			var rows = [];
			_.each(elem.children, function(elem) {
				var tokens, times;
				if (elem.type === 'tag') {
					if (elem.name === 'th') {
						tokens = formatTitle(elem, fn, options).split('\n');
						rows.push(_.compact(tokens));
					} else if (elem.name === 'td') {
						tokens = fn(elem.children, options).split('\n');
						rows.push(_.compact(tokens));
						// Fill colspans with empty values
						if (elem.attribs && elem.attribs.colspan) {
							times = elem.attribs.colspan - 1;
							_.times(times, function() {
								rows.push(['']);
							});
						}
					}
				}
			});
			rows = zip(rows);
			_.each(rows, function(row) {
				row = _.map(row, function(col) {
					return col || '';
				});
				table.push(row);
			});
		}
	});
	return tableToString(table);
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
	return attr && (_.include(classes, attr.class) || _.include(ids, attr.id));
}

function walk(dom, options) {
	var result = '';
	_.each(dom, function(elem) {
		switch(elem.type) {
			case 'tag':
				switch(elem.name) {
					case 'a':
						result += formatAnchor(elem, walk, options);
						break;
					case 'p':
						result += formatParagraph(elem, walk, options);
						break;
					case 'h1':
					case 'h2':
					case 'h3':
					case 'h4':
						result += formatTitle(elem, walk, options);
						break;
					case 'br':
						result += formatBreak(elem, walk, options);
						break;
					case 'hr':
						result += formatHorizontalLine(elem, walk, options);
						break;
					case 'ul':
					case 'ol':
						result += formatList(elem, walk, options);
						break;
					case 'table':
						if (containsTable(elem.attribs, options.tables)) {
							result += formatTable(elem, walk, options);
							break;
						}
					default:
						result += walk(elem.children || [], options);
				}
				break;
			case 'text':
				if (elem.raw !== '\r\n') result += formatText(elem, options);
				break;
			default:
				result += walk(elem.children || [], options);
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