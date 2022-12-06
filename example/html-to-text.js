import { readFileSync } from 'fs';

import { htmlToText } from '../packages/html-to-text/src/html-to-text';
// const { htmlToText } = require('../packages/html-to-text/lib/html-to-text'); // build it first


console.log('From string:');
const text = htmlToText(
  '<h1>Hello World</h1>',
  { wordwrap: 130 }
);
console.log(text);
console.log();

console.log('From file:');
const filePath = new URL('test.html', import.meta.url);
/** @type { Options } */
const options = {
  selectors: [
    { selector: 'table', format: 'block' },
    { selector: 'table#invoice', format: 'dataTable' },
    { selector: 'table.address', format: 'dataTable' },
  ]
};
const text2 = htmlToText(readFileSync(filePath, 'utf8'), options);
console.log(text2);
