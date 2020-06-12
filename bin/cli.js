#!/usr/bin/env node
const parseArgs = require('minimist');

const { htmlToText } = require('../lib/html-to-text');


const argv = parseArgs(process.argv.slice(2), {
  alias: {
    'ignore-href': 'ignoreHref',
    'ignore-image': 'ignoreImage'
  },
  boolean: [
    'noLinkBrackets',
    'ignoreHref',
    'ignoreImage'
  ],
  default: { 'wordwrap': 80 },
  string: [ 'tables' ]
});

argv.tables = interpretTables(argv.tables);

let text = '';

process.title = 'html-to-text';

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
  text += data;
});

process.stdin.on('end', function () {
  text = htmlToText(text, argv);
  process.stdout.write(text + '\n', 'utf-8');
});

function interpretTables (tables) {
  if (!tables || tables === '' || tables === 'false') {
    return [];
  }
  return tables === 'true' || tables.split(',');
}
