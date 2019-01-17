var path = require('path');

var htmlToText = require('../lib/html-to-text');

console.log('fromString:');
var text = htmlToText.fromString('<h1>Hello World</h1>', {
  wordwrap: 130,
  hasMergedTags: true,
  mergedTags: {
    'name': 'Mudassir'
  }
});
console.log(text);
console.log();

console.log('fromFile:');
htmlToText.fromFile(path.join(__dirname, 'test.html'), {
  tables: ['#invoice', '.address'],
  hasMergedTags: true,
  mergedTags: {
    'name': 'Mudassir',
    'email': 'mudassir@test.com',
    'date': '12 Feb 2019'
  }
}, function(err, text) {
  if (err) return console.error(err);
  console.log(text);
});