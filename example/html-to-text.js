const fs = require('fs');
const path = require('path');

const { htmlToText } = require('../packages/html-to-text/src/html-to-text');
// const { htmlToText } = require('../packages/html-to-text/lib/html-to-text'); // build it first


console.log('From string:');
const text = htmlToText(
  '<h1>Hello World</h1>',
  { wordwrap: 130 }
);
console.log(text);
console.log();

console.log('From file:');
const filePath = path.join(__dirname, 'test.html');
/** @type { Options } */
const options = { tables: ['#invoice', '.address'] };
const text2 = htmlToText(fs.readFileSync(filePath, 'utf8'), options);
console.log(text2);
