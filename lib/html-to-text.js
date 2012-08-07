var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var htmlparser = require("htmlparser");

function trim(text) {
	return text.replace(/^[\n\r ]*/, '').replace(/[\n\r ]*$/, '');
}

function htmlToText(html) {
	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		
	}, { verbose: true, ignoreWhitespace: true });
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);
	var result = buildText(filterBody(handler.dom));
	return trim(result);
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

function buildText(dom, options) {
	options = options || {};
	var tables = options.tables || [];
	var result = '';
	function walk(dom, state) {
		var state = state;
		if (state === 'p') {
			result += '\n';
		} else if (state === 'title') {
			result += '\n';
		} else if (state === 'table') {
			result += '\n';
		}
		_.each(dom, function(elem) {
			if (elem.type === 'text') {
				if (elem.raw === '\r\n') return true;
				if (state === 'title') {
					result += elem.raw.toUpperCase();
				} else if (state === 'table.tr.th') {
					result += elem.raw.toUpperCase() + '\t';
				} else {
					result += elem.raw;
				}
			} else if (elem.type === 'tag') {
				if (elem.name === 'p') {
					state = 'p';
				} else if (elem.name === 'h2' || elem.name === 'h1') {
					state = 'title';
				} else if (elem.name === 'table') {
					if (!~tables.indexOf(elem.attribs.class)) {
						state = 'table';
					}
				} else if (state === 'table' && elem.name === 'tr') {
					state = 'table.tr';
				} else if (state === 'table.tr') {
					if (elem.name === 'td') {
						state = 'table.tr.td';
					} else if (elem.name === 'th') {
						state = 'table.tr.th';
					}
				}
			}
			
			if (elem.children) {
				walk(elem.children, state);
			}
		});
		if (state === 'p') {
			result += '\n';
		} else if (state === 'table') {
			result += '\n';
		}
	}
	walk(dom);
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

exports.fromText = function(str, options, callback) {
	if (!callback) {
		callback = options;
		options = {};
	}
	var result = htmlToText(str, options);
	return callback(null, result);
};