var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var _s = require('underscore.string');
var htmlparser = require("htmlparser");

function htmlToText(html, options) {
	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		
	}, { 
		verbose: true, 
		ignoreWhitespace: true 
	});
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);
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
	return result;
}

function convertHtmlSpecials(text) {
	return text.replace(/&nbsp;|&emsp;/, ' ');
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

function formatText(text, options) {
	options = options || {};
	text = _s.strip(text).replace(/[\r\n]*/g, '');
	text = convertHtmlSpecials(text);
	text = wordwrap(text, options.wordwrap || 80);
	return text;
}

function formatBreak(dom, fn) {
	return '\n' + fn(dom);
}

function formatParagraph(dom, fn) {
	return '\n' + fn(dom) + '\n';
}

function formatTitle(dom, fn) {
	return formatBreak(dom, fn).toUpperCase();
}

function tableToString(table) {
	// Determine space with per column
	// Convert all rows to lengths
	var widths = _.map(table, function(row) {
		return _.map(row, function(col) {
			return _.chain(col.split('\n')).map(function(token) {
				return token.length;
			}).max().value();
		});
	});
	// Invert rows with colums
	widths = _.zip.apply(_, widths);
	// Determine the max values for each column
	widths = _.map(widths, function(col) {
		return _.max(col);
	});

	// Build the table
	var text = '\n';
	_.each(table, function(row) {
		var i = 0;
		_.each(row, function(col) {
			text += _s.rpad(_s.strip(col), widths[i++], ' ') + ' | ';
		});
		text += '\n';
	});
	return text;
}

function formatTable(dom, fn) {
	var table = [];
	_.each(dom, function(elem) {
		if (elem.type === 'tag' && elem.name === 'tr') {
			var row = [];
			_.each(elem.children, function(elem) {
				if (elem.type === 'tag') {
					if (elem.name === 'th') {
						row.push(formatTitle(elem.children, fn));
					} else if (elem.name === 'td') {
						row.push(fn(elem.children));
						// Fill colspans with empty values
						if (elem.attribs) {
							var times = elem.attribs.colspan - 1 || 0;
							_.times(times, function() {
								row.push('');
							});
						}
					}
				}
			});
			table.push(row);
		}
	});
	return tableToString(table);
}

function buildText(dom, options) {
	options = options || {};
	var tables = options.tables || [];
	function walk(dom) {
		var result = '';
		_.each(dom, function(elem) {
			switch(elem.type) {
				case 'tag':
					switch(elem.name) {
						case 'p':
							result += formatParagraph(elem.children, walk);
							break;
						case 'h1':
						case 'h2':
						case 'h3':
							result += formatTitle(elem.children, walk);
							break;
						case 'br':
							result += formatBreak(elem.children, walk);
							break;
						case 'table':
							if (_.include(tables, elem.attribs.class)) {
								result += formatTable(elem.children, walk);
								break;
							}
						default:
							result += walk(elem.children || []);
					}
					break;
				case 'text':
					if (elem.raw !== '\r\n') result += formatText(elem.raw);
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

exports.fromText = function(str, options, callback) {
	if (!callback) {
		callback = options;
		options = {};
	}
	var result = htmlToText(str, options);
	return callback(null, result);
};