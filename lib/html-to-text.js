var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var htmlparser = require("htmlparser");

function htmlToText(html) {
	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		
	});
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);
	var result = formatNodes(filterTextNodes(filterBody(handler.dom)));
	console.log(result);
	return '';
}

function filterBody(dom) {
	var result = null;
	function walk(dom) {
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

function filterTextNodes(dom) {
	var result = [];
	function walk(dom) {
		_.each(dom, function(elem) {
			if (elem.type === 'text' && elem.raw !== '\r\n') {
				result.push(elem);
			}
			if (elem.children) {
				walk(elem.children);
			}
		});
	}
	walk(dom);
	return result;
}

function formatNodes(dom) {
	console.log(dom)
	return _.map(dom, function(elem) {
		return elem.raw.replace('\r\n', '');
	}).join('\n');
}

exports.fromFile = function(file, callback) {
	fs.readFile(file, 'utf8', function(err, str) {
		var result = htmlToText(str);
		return callback(null, result);
	});
};

exports.fromText = function(str, callback) {
	var result = htmlToText(str);
	return callback(null, result);
};