var path = require('path');

var htmlToText = require('../lib/html-to-text');

console.log('fromString:');
var text = htmlToText.fromString('<h1>Hello World</h1>', {
	wordwrap: 130
});
console.log(text);
console.log();

htmlToText.fromFile(path.join(__dirname, 'test.html'), {
	tables: ['#invoice', '.address']
}, function(err, text) {
	if (err) return console.error(err);
	console.log('fromFile:');
	console.log(text);
	console.log();
});

htmlToText.fromFile(
	path.join(__dirname, 'test-custom.html'),
	{
		tables: ['#tabular_data'],
		custom: function (elem) {
			if (elem.type === 'tag' && elem.name === 'img' && elem.attribs['alt'] === 'graph') {
				return "To see the graph, visit here: http://my-site.com/reports/graph";
			}
			if (elem.type === 'tag' && elem.name === 'table' && elem.attribs['id'] === 'tabular_data') {
				return ["(For best results, please see the HTML version, or visit our site)\n", true];
			}
		}
	},
	function(err, text) {
		if (err) return console.error(err);
		console.log('custom:');
		console.log(text);
		console.log();
	}
);