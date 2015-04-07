#!/usr/bin/env node
var optimist = require('optimist');

var htmlToText = require('../lib/html-to-text');

var argv = optimist
	.default('tables', '')
	.default('wordwrap', 80)
	.default('ignore-href', false)
	.default('ignore-image', false)
	.argv;

console.log(argv);
var text = '';

process.title = 'html-to-text';

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function data(data) {
	text += data;
});

process.stdin.on('end', function end() {
	text = htmlToText.fromString(text, {
		tables: argv.tables.split(','),
		wordwrap: argv.wordwrap,
		ignoreHref: argv['ignore-href'],
		ignoreImage: argv['ignore-image']
	});
	process.stdout.write(text + '\n', 'utf-8');
});