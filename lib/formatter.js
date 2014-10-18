var _ = require('underscore');
var _s = require('underscore.string');

var helper = require('./helper');

function formatText(elem, options) {
	var text = _s.strip(elem.raw);
	text = helper.decodeHTMLEntities(text);
	return helper.wordwrap(elem.needsSpace ? ' ' + text : text, options.wordwrap);
}

function formatImage(elem, options) {
	var result = '';
	if (elem.attribs.alt) {
		result += elem.attribs.alt;
	}
	if (elem.attribs.alt && elem.attribs.src) {
		result += ' ';
	}
	if (elem.attribs.src) {
		result += '[' + elem.attribs.src + ']';
	}
	return (result);
}

function formatLineBreak(elem, fn, options) {
	return '\n' + fn(elem.children, options);
}

function formatParagraph(elem, fn, options) {
	return fn(elem.children, options) + '\n\n';
}

function formatHeading(elem, fn, options) {
	return fn(elem.children, options).toUpperCase() + '\n';
}

// If we have both href and anchor text, format it in a useful manner:
// - "anchor text [href]"
// Otherwise if we have only anchor text or an href, we return the part we have:
// - "anchor text" or
// - "href"
function formatAnchor(elem, fn, options) {
	var href = '';
	// Always get the anchor text
	var result = _s.strip(fn(elem.children || [], options));
	if (!result) {
		result = '';
	}
	// Get the href, if present
	if (elem.attribs && elem.attribs.href) {
		href = elem.attribs.href.replace(/^mailto\:/, '');
	}
	if (href) {
		result += ' [' + href + ']';
	}
	return formatText({ raw: result || href, needsSpace: elem.needsSpace }, options);
}

function formatHorizontalLine(elem, fn, options) {
	return _s.repeat('-', options.wordwrap) + '\n\n';
}

function formatListItem(prefix, elem, fn, options) {
	options = _.clone(options);
	// Reduce the wordwrap for sub elements.
	options.wordwrap -= prefix.length;
	// Process sub elements.
	var text = fn(elem.children, options);
	// Replace all line breaks with line break + prefix spacing.
	text = text.replace(/\n/g, '\n' + _s.repeat(' ', prefix.length));
	// Add first prefix and line break at the end.
	return prefix + text + '\n';
}

function formatUnorderedList(elem, fn, options) {
	var result = '';
	_.each(elem.children, function(elem) {
		result += formatListItem(' * ', elem, fn, options);
	});
	return result + '\n';
}

function formatOrderedList(elem, fn, options) {
	var result = '';
	// Make sure there are list items present
	if (elem.children && elem.children.length) {
		// Calculate the maximum length to i.
		var maxLength = elem.children.length.toString().length;
		_.each(elem.children, function(elem, i) {
			var index = i + 1;
			// Calculate the needed spacing for nice indentation.
			var spacing = maxLength - index.toString().length;
			var prefix = ' ' + index + '. ' + _s.repeat(' ', spacing);
			result += formatListItem(prefix, elem, fn, options);
		});
	}
	return result + '\n';
}

function tableToString(table) {
	// Determine space width per column
	// Convert all rows to lengths
	var widths = _.map(table, function(row) {
		return _.map(row, function(col) {
			return col.length;
		});
	});
	// Invert rows with colums
	widths = helper.arrayZip(widths);
	// Determine the max values for each column
	widths = _.map(widths, function(col) {
		return _.max(col);
	});

	// Build the table
	var text = '';
	_.each(table, function(row) {
		var i = 0;
		_.each(row, function(col) {
			text += _s.rpad(_s.strip(col), widths[i++], ' ') + '   ';
		});
		text += '\n';
	});
	return text + '\n';
}

function formatTable(elem, fn, options) {
	var table = [];
	_.each(elem.children, function(elem) {
		if (elem.type === 'tag' && elem.name === 'tr') {
			var rows = [];
			_.each(elem.children, function(elem) {
				var tokens, times;
				if (elem.type === 'tag') {
					if (elem.name === 'th') {
						tokens = formatHeading(elem, fn, options).split('\n');
						rows.push(_.compact(tokens));
					} else if (elem.name === 'td') {
						tokens = fn(elem.children, options).split('\n');
						rows.push(_.compact(tokens));
						// Fill colspans with empty values
						if (elem.attribs && elem.attribs.colspan) {
							times = elem.attribs.colspan - 1;
							_.times(times, function() {
								rows.push(['']);
							});
						}
					}
				}
			});
			rows = helper.arrayZip(rows);
			_.each(rows, function(row) {
				row = _.map(row, function(col) {
					return col || '';
				});
				table.push(row);
			});
		}
	});
	return tableToString(table);
}

exports.text = formatText;
exports.image = formatImage;
exports.lineBreak = formatLineBreak;
exports.paragraph = formatParagraph;
exports.anchor = formatAnchor;
exports.heading = formatHeading;
exports.table = formatTable;
exports.orderedList = formatOrderedList;
exports.unorderedList = formatUnorderedList;
exports.listItem = formatListItem;
exports.horizontalLine = formatHorizontalLine;
