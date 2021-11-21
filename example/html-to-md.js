const fs = require('fs');
const path = require('path');

const { htmlToMarkdown } = require('../packages/html-to-md/src/html-to-md');
// const { htmlToMarkdown } = require('../packages/html-to-md/lib/html-to-md'); // build it first


console.log('From string:');
const text = htmlToMarkdown(
  '<h1>Hello World</h1>',
  {}
);
console.log(text);
console.log();

console.log('From file:');
const filePath = path.join(__dirname, 'test.html');
/** @type { Options } */
const options = {
  selectors: [
    { selector: 'table', format: 'block' },
    { selector: 'table#invoice', format: 'dataTable' },
    { selector: 'table.address', format: 'dataTable' },
  ]
};
const text2 = htmlToMarkdown(fs.readFileSync(filePath, 'utf8'), options);
console.log(text2);
