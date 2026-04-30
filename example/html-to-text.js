import { readFileSync } from 'fs';

import { htmlToText, compile } from '../packages/html-to-text/src/html-to-text.js';
// import { htmlToText, compile } from '../packages/html-to-text/lib/html-to-text.mjs'; // build it first


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
console.log();

console.log('Batch processing:');
const compiledConvert = compile(options);
const inputPaths = [
  new URL('test.html', import.meta.url),
  // ...
];
for (const path of inputPaths) {
  const html = readFileSync(path, 'utf8');
  const text3 = compiledConvert(html);
  console.log(text3);
}
