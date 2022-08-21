import { readFileSync } from 'fs';

import { htmlToMarkdown } from '../packages/html-to-md/src/html-to-md';
// const { htmlToMarkdown } = require('../packages/html-to-md/lib/html-to-md'); // build it first


console.log('From string:');
const text = htmlToMarkdown(
  '<h1>Hello World</h1>',
  {}
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
const text2 = htmlToMarkdown(readFileSync(filePath, 'utf8'), options);
console.log(text2);
