#!/usr/bin/env node
var optimist = require('optimist');

var htmlToText = require('../lib/html-to-text');

var argv = optimist
	.string('tables')
	.default('wordwrap', 80)
	.default('ignore-href', false)
	.default('ignore-image', false)
	.argv;

var text = '';

process.title = 'html-to-text';

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function data(data) {
	text += data;
});

process.stdin.on('end', function end() {
	text = htmlToText.fromString(text, {
		tables: interpretTables(argv.tables),
		wordwrap: argv.wordwrap,
		ignoreHref: argv['ignore-href'],
		ignoreImage: argv['ignore-image']
	});
	process.stdout.write(text + '\n', 'utf-8');
});

function interpretTables(tables) {
	if (!tables || tables === '' || tables === 'false') {
		return [];
	}
	return tables === 'true' || tables.split(',');
}
