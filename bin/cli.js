#!/usr/bin/env node
var parseArgs = require('minimist');

var htmlToText = require('../lib/html-to-text');

var argv = parseArgs(process.argv.slice(2), {
  string: [
    'tables'
  ],
  boolean: [
    'noLinkBrackets',
    'ignoreHref',
    'ignoreImage'
  ],
  alias: {
    'ignore-href': 'ignoreHref',
    'ignore-image': 'ignoreImage'
  },
  default: {
    'wordwrap': 80
  }
});

argv.tables = interpretTables(argv.tables);

var text = '';

process.title = 'html-to-text';

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function data(data) {
  text += data;
});

process.stdin.on('end', function end() {
  text = htmlToText.fromString(text, argv);
  process.stdout.write(text + '\n', 'utf-8');
});

function interpretTables(tables) {
  if (!tables || tables === '' || tables === 'false') {
    return [];
  }
  return tables === 'true' || tables.split(',');
}
