var _ = require('underscore');
var _s = require('underscore.string');
var he = require('he');

var helper = require('./helper');

function formatText(elem, options) {
	var text = elem.raw;
	text = he.decode(text, options.decodeOptions);

	if (options.isInPre) {
		return text;
	} else {
		return helper.wordwrap(elem.trimLeadingSpace ? _s.lstrip(text) : text, options);
	}
}

function formatImage(elem, options) {
	if (options.ignoreImage) {
		return '';
	}

	var result = '', attribs = elem.attribs || {};
	if (attribs.alt) {
		result += he.decode(attribs.alt, options.decodeOptions);
		if (attribs.src) {
			result += ' ';
		}
	}
	if (attribs.src) {
		result += '[' + attribs.src + ']';
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
	var heading = fn(elem.children, options);
	if (options.uppercaseHeadings) {
		heading = heading.toUpperCase();
	}
	return heading + '\n';
}

// If we have both href and anchor text, format it in a useful manner:
// - "anchor text [href]"
// Otherwise if we have only anchor text or an href, we return the part we have:
// - "anchor text" or
// - "href"
function formatAnchor(elem, fn, options) {
	var href = '';
	// Always get the anchor text
	var storedCharCount = options.lineCharCount;
	var text = fn(elem.children || [], options);
	if (!text) {
		text = '';
	}

	var result = elem.trimLeadingSpace ? _s.lstrip(text) : text;

	if (!options.ignoreHref) {
		// Get the href, if present
		if (elem.attribs && elem.attribs.href) {
			href = elem.attribs.href.replace(/^mailto\:/, '');
		}
		if (href) {
			if (options.linkHrefBaseUrl && href.indexOf('/') == 0) {
				href = options.linkHrefBaseUrl + href;
			}
			if (!options.hideLinkHrefIfSameAsText || href != _s.replaceAll(result, '\n', '')) {
				result += ' [' + href + ']';
			}
		}
	}

	options.lineCharCount = storedCharCount;

	return formatText({ raw: result || href, trimLeadingSpace: elem.trimLeadingSpace }, options);
}

function formatHorizontalLine(elem, fn, options) {
	return '\n' + _s.repeat('-', options.wordwrap) + '\n\n';
}

function formatListItem(prefix, elem, fn, options) {
	options = _.clone(options);
	// Reduce the wordwrap for sub elements.
  if (options.wordwrap) {
  	options.wordwrap -= prefix.length;
  }
	// Process sub elements.
	var text = fn(elem.children, options);
	// Replace all line breaks with line break + prefix spacing.
	text = text.replace(/\n/g, '\n' + _s.repeat(' ', prefix.length));
	// Add first prefix and line break at the end.
	return prefix + text + '\n';
}

var whiteSpaceRegex = /^\s*$/;

function formatUnorderedList(elem, fn, options) {
	var result = '';
	var nonWhiteSpaceChildren = (elem.children || []).filter(function(child) {
		return child.type !== 'text' || !whiteSpaceRegex.test(child.raw);
	});
	_.each(nonWhiteSpaceChildren, function(elem) {
		result += formatListItem(' * ', elem, fn, options);
	});
	return result + '\n';
}

function formatOrderedList(elem, fn, options) {
	var result = '';
	var nonWhiteSpaceChildren = (elem.children || []).filter(function(child) {
		return child.type !== 'text' || !whiteSpaceRegex.test(child.raw);
	});
	// Make sure there are list items present
	if (nonWhiteSpaceChildren.length) {
		// Calculate the maximum length to i.
		var maxLength = nonWhiteSpaceChildren.length.toString().length;
		_.each(nonWhiteSpaceChildren, function(elem, i) {
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
	_.each(elem.children, tryParseRows);
	return tableToString(table);

	function tryParseRows(elem) {
		if (elem.type !== 'tag') {
			return;
		}
		switch (elem.name.toLowerCase()) {
			case "thead":
			case "tbody":
			case "tfoot":
			case "center":
				_.each(elem.children, tryParseRows);
				return;

			case 'tr':
				var rows = [];
				_.each(elem.children, function(elem) {
					var tokens, times;
					if (elem.type === 'tag') {
						switch (elem.name.toLowerCase()) {
							case 'th':
								tokens = formatHeading(elem, fn, options).split('\n');
								rows.push(_.compact(tokens));
								break;

							case 'td':
								tokens = fn(elem.children, options).split('\n');
								rows.push(_.compact(tokens));
								// Fill colspans with empty values
								if (elem.attribs && elem.attribs.colspan) {
									times = elem.attribs.colspan - 1;
									_.times(times, function() {
										rows.push(['']);
									});
								}
								break;
						}
					}
				});
				rows = helper.arrayZip(rows);
				_.each(rows, function(row) {
					row = _.map(row, function(col) {
						return col || '';
					});
					table.push(row);
				});
				break;
		}
	}
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
