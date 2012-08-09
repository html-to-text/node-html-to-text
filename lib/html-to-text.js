var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var _s = require('underscore.string');
var htmlparser = require("htmlparser");

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
	
	var result = buildText(filterBody(handler.dom), options);
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

function convertHtmlSpecials(text) {
	return text.replace(/&nbsp;|&emsp;/, ' ').replace('&euro;', '€');
}

function wordwrap(text, max) {
	if (text.length > max) {
		var words = _s.words(text);
		var length = 0;
		text = '';
		_.each(words, function(word) {
			if (length + word.length <= max) {
				text += word;
				length += word.length;
			} 
			if (length + 1 <= max) {
				text += ' ';
				length++;
			} else {
				text += '\n';
				length = 0;
			}
		});
	}
	return text;
}

function formatText(elem, options) {
	options = options || {};
	var text = elem.raw;
	text = _s.strip(text);
	text = convertHtmlSpecials(text);
	text = wordwrap(text, options.wordwrap || 80);
	return text;
}

function formatBreak(elem, fn) {
	return '\n' + fn(elem.children);
}

function formatParagraph(elem, fn) {
	return '\n' + fn(elem.children) + '\n';
}

function formatTitle(elem, fn) {
	return formatBreak(elem, fn).toUpperCase();
}

function formatAnchor(elem, fn) {
	return elem.attribs.href;
}

function formatHorizontalLine(elem, fn, options) {
	return '\n' + _s.repeat('-', options.wordwrap || 80) + '\n';
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
	var text = '\n';
	_.each(table, function(row) {
		var i = 0;
		_.each(row, function(col) {
			text += _s.rpad(_s.strip(col), widths[i++], ' ') + '   ';
		});
		text += '\n';
	});
	return text;
}

function formatTable(elem, fn) {
	var table = [];
	_.each(elem.children, function(elem) {
		if (elem.type === 'tag' && elem.name === 'tr') {
			var rows = [];
			_.each(elem.children, function(elem) {
				var tokens, times;
				if (elem.type === 'tag') {
					if (elem.name === 'th') {
						tokens = formatTitle(elem, fn).split('\n');
						rows.push(_.compact(tokens));
					} else if (elem.name === 'td') {
						tokens = fn(elem.children).split('\n');
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

function buildText(dom, options) {
	function walk(dom) {
		var result = '';
		_.each(dom, function(elem) {
			switch(elem.type) {
				case 'tag':
					switch(elem.name) {
						case 'a':
							result += formatAnchor(elem, walk);
							break;
						case 'p':
							result += formatParagraph(elem, walk);
							break;
						case 'h1':
						case 'h2':
						case 'h3':
						case 'h4':
							result += formatTitle(elem, walk);
							break;
						case 'br':
							result += formatBreak(elem, walk);
							break;
						case 'hr':
							result += formatHorizontalLine(elem, walk, options);
							break;
						case 'table':
							if (elem.attribs && elem.attribs.class && _.include(options.tables, elem.attribs.class)) {
								result += formatTable(elem, walk);
								break;
							}
						default:
							result += walk(elem.children || []);
					}
					break;
				case 'text':
					if (elem.raw !== '\r\n') result += formatText(elem, options);
					break;
				default:
					result += walk(elem.children || []);
			}
		});
		return result;
	}
	return walk(dom);
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