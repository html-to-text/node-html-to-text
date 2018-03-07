var max = require('lodash/max');
var compact = require('lodash/compact');
var times = require('lodash/times');

var trimStart = require('lodash/trimStart');
var padEnd = require('lodash/padEnd');

var he = require('he');

var helper = require('./helper');

function formatText(elem, options) {
  var text = elem.data || "";
  text = he.decode(text, options.decodeOptions);

  if (options.isInPre) {
    return text;
  } else {
    return helper.wordwrap(elem.trimLeadingSpace ? trimStart(text) : text, options);
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
  var paragraph = fn(elem.children, options);
  if (options.singleNewLineParagraphs) {
    return paragraph + '\n';
  } else {
    return paragraph + '\n\n';
  }
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

  var result = elem.trimLeadingSpace ? trimStart(text) : text;

  if (!options.ignoreHref) {
    // Get the href, if present
    if (elem.attribs && elem.attribs.href) {
      href = elem.attribs.href.replace(/^mailto:/, '');
    }
    if (href) {
      if ((!options.noAnchorUrl) || (options.noAnchorUrl && href[0] !== '#')) {
        if (options.linkHrefBaseUrl && href.indexOf('/') === 0) {
          href = options.linkHrefBaseUrl + href;
        }
        if (!options.hideLinkHrefIfSameAsText || href !== helper.replaceAll(result, '\n', '')) {
          if (!options.noLinkBrackets) {
            result += ' [' + href + ']';
          } else {
            result += ' ' + href;
          }
        }
      }
    }
  }

  options.lineCharCount = storedCharCount;

  return formatText({ data: result || href, trimLeadingSpace: elem.trimLeadingSpace }, options);
}

function formatHorizontalLine(elem, fn, options) {
  return '\n' + '-'.repeat(options.wordwrap) + '\n\n';
}

function formatListItem(prefix, elem, fn, options) {
  options = Object.assign({}, options);
  // Reduce the wordwrap for sub elements.
  if (options.wordwrap) {
    options.wordwrap -= prefix.length;
  }
  // Process sub elements.
  var text = fn(elem.children, options);
  // Replace all line breaks with line break + prefix spacing.
  text = text.replace(/\n/g, '\n' + ' '.repeat(prefix.length));
  // Add first prefix and line break at the end.
  return prefix + text + '\n';
}

var whiteSpaceRegex = /^\s*$/;

function formatUnorderedList(elem, fn, options) {
  var result = '';
  var prefix = options.unorderedListItemPrefix;
  var nonWhiteSpaceChildren = (elem.children || []).filter(function(child) {
    return child.type !== 'text' || !whiteSpaceRegex.test(child.data);
  });
  nonWhiteSpaceChildren.forEach(function(elem) {
    result += formatListItem(prefix, elem, fn, options);
  });
  return result + '\n';
}

function formatOrderedList(elem, fn, options) {
  var result = '';
  var nonWhiteSpaceChildren = (elem.children || []).filter(function(child) {
    return child.type !== 'text' || !whiteSpaceRegex.test(child.data);
  });
  // Return different functions for different OL types
  var typeFunction = (function() {
    // Determine type
    var olType = elem.attribs.type || '1';
    // TODO Imeplement the other valid types
    //   Fallback to type '1' function for other valid types
    switch(olType) {
      case 'a': return function(start, i) { return String.fromCharCode(i + start + 97);};
      case 'A': return function(start, i) { return String.fromCharCode(i + start + 65);};
      case '1':
      default: return function(start, i) { return i + 1 + start;};
    }
  }());
  // Make sure there are list items present
  if (nonWhiteSpaceChildren.length) {
    // Calculate initial start from ol attribute
    var start = Number(elem.attribs.start || '1') - 1;
    // Calculate the maximum length to i.
    var maxLength = (nonWhiteSpaceChildren.length + start).toString().length;
    nonWhiteSpaceChildren.forEach(function(elem, i) {
      // Use different function depending on type
      var index = typeFunction(start, i);
      // Calculate the needed spacing for nice indentation.
      var spacing = maxLength - index.toString().length;
      var prefix = ' ' + index + '. ' + ' '.repeat(spacing);
      result += formatListItem(prefix, elem, fn, options);
    });
  }
  return result + '\n';
}

function tableToString(table) {
  // Determine space width per column
  // Convert all rows to lengths
  var widths = table.map(function(row) {
    return row.map(function(col) {
      return col.length;
    });
  });
  // Invert rows with colums
  widths = helper.arrayZip(widths);
  // Determine the max values for each column
  widths = widths.map(function(col) {
    return max(col);
  });

  // Build the table
  var text = '';
  table.forEach(function(row) {
    var i = 0;
    row.forEach(function(col) {
      text += padEnd(col.trim(), widths[i++], ' ') + '   ';
    });
    text += '\n';
  });
  return text + '\n';
}

function formatTable(elem, fn, options) {
  var table = [];
  elem.children.forEach(tryParseRows);
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
        elem.children.forEach(tryParseRows);
        return;

      case 'tr':
        var rows = [];
        elem.children.forEach(function(elem) {
          var tokens, count;
          if (elem.type === 'tag') {
            switch (elem.name.toLowerCase()) {
              case 'th':
                tokens = formatHeading(elem, fn, options).split('\n');
                rows.push(compact(tokens));
                break;

              case 'td':
                tokens = fn(elem.children, options).split('\n');
                rows.push(compact(tokens));
                // Fill colspans with empty values
                if (elem.attribs && elem.attribs.colspan) {
                  count = elem.attribs.colspan - 1 || 0;
                  times(count, function() {
                    rows.push(['']);
                  });
                }
                break;
            }
          }
        });
        rows = helper.arrayZip(rows);
        rows.forEach(function(row) {
          row = row.map(function(col) {
            return col || '';
          });
          table.push(row);
        });
        break;
    }
  }
}

function formatBlockquote(elem, fn, options) {
  return '> ' + fn(elem.children, options) + '\n';
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
exports.blockquote = formatBlockquote;
