const he = require('he');
const compact = require('lodash/compact');
const get = require('lodash/get');
const max = require('lodash/max');
const times = require('lodash/times');
const zip = require('lodash/zip');

const { wordwrap } = require('./helper');
// eslint-disable-next-line import/no-unassigned-import
require('./typedefs');


/**
 * Dummy formatter that discards the input and returns an empty string.
 *
 * @type { FormatCallback }
 */
function formatSkip (elem, fn, options) {
  return '';
}

/**
 * Convert a container with it's child elements to a plain string.
 *
 * @type { FormatCallback }
 */
function formatChildren (elem, fn, options) {
  return fn(elem.children || [], options);
}

/**
 * Convert a text node to a plain string.
 *
 * @type { FormatCallback }
 */
function formatText (elem, fn, options) {
  const text = he.decode(elem.data || '', options.decodeOptions);

  if (options.isInPre) {
    return text;
  } else {
    return wordwrap(text, options, options.lineCharCount);
  }
}

/**
 * Convert an image to a plain string.
 *
 * @type { FormatCallback }
 */
function formatImage (elem, fn, options) {
  if (options.ignoreImage) {
    return '';
  }

  let result = '';
  const attribs = elem.attribs || {};
  if (attribs.alt) {
    result += he.decode(attribs.alt, options.decodeOptions);
    if (attribs.src) {
      result += ' ';
    }
  }
  if (attribs.src) {
    let { src } = attribs;
    if (options.linkHrefBaseUrl && src.indexOf('/') === 0) {
      src = options.linkHrefBaseUrl + src;
    }
    result += '[' + src + ']';
  }
  return result;
}

/**
 * Convert a line-break to a plain string.
 *
 * @type { FormatCallback }
 */
function formatLineBreak (elem, fn, options) {
  return '\n' + fn(elem.children, options);
}

/**
 * Convert a paragraph to a plain string.
 *
 * @type { FormatCallback }
 */
function formatParagraph (elem, fn, options) {
  const paragraph = fn(elem.children, options);
  if (options.singleNewLineParagraphs) {
    return paragraph + '\n';
  } else {
    return paragraph + '\n\n';
  }
}

/**
 * Convert a preformatted content to a plain string.
 *
 * @type { FormatCallback }
 */
function formatPre (elem, fn, options) {
  const newOptions = Object.assign({}, options);
  newOptions.isInPre = true;
  return formatParagraph(elem, fn, newOptions);
}

/**
 * Convert a heading to a plain string.
 *
 * @type { FormatCallback }
 */
function formatHeading (elem, fn, options) {
  let heading = fn(elem.children, options);
  if (options.uppercaseHeadings) {
    heading = heading.toUpperCase();
  }
  return heading + '\n';
}


/**
 * Convert an anchor to a plain string.
 *
 * @type { FormatCallback }
 */
function formatAnchor (elem, fn, options) {
  function getHref () {
    if (options.ignoreHref) { return undefined; }
    if (!elem.attribs || !elem.attribs.href) { return undefined; }
    const href = elem.attribs.href.replace(/^mailto:/, '');
    if (options.noAnchorUrl && href[0] === '#') { return undefined; }
    return (options.linkHrefBaseUrl && href[0] === '/')
      ? options.linkHrefBaseUrl + href
      : href;
  }
  function getText () {
    return fn(elem.children || [], options) || '';
  }

  const storedCharCount = options.lineCharCount;
  const text = getText();
  const href = getHref();
  const toHideSameLink = options.hideLinkHrefIfSameAsText && href === text.replace(/\n/g, '');
  const result = (!href || toHideSameLink)
    ? text
    : (!text)
      ? href
      : (options.noLinkBrackets)
        ? text + ' ' + href
        : text + ' [' + href + ']';

  options.lineCharCount = storedCharCount;
  return formatText({ data: result, type: 'text' }, null, options);
}

/**
 * Convert a horizontal line to a plain string.
 *
 * @type { FormatCallback }
 */
function formatHorizontalLine (elem, fn, options) {
  return '\n' + '-'.repeat(options.wordwrap) + '\n\n';
}

/**
 * Convert a list item to a plain string.
 *
 * @param   { string }            prefix  Prefix for the list item (bullet point, number etc).
 * @param   { DomNode }           elem    List item node.
 * @param   { RecursiveCallback } fn      Recursive callback to process child nodes.
 * @param   { Options }           options HtmlToText options.
 * @returns { string }
 * @private
 */
function formatListItem (prefix, elem, fn, options) {
  options = Object.assign({}, options);
  // Reduce the wordwrap for sub elements.
  if (options.wordwrap) {
    options.wordwrap -= prefix.length;
  }
  // Process sub elements.
  let text = fn(elem.children, options);
  // Replace all line breaks with line break + prefix spacing.
  text = text.replace(/\n/g, '\n' + ' '.repeat(prefix.length));
  // Add first prefix and line break at the end.
  return prefix + text + '\n';
}

const WHITE_SPACES_ONLY_REGEX = /^\s*$/;

/**
 * Convert an unordered list to a plain string.
 *
 * @type { FormatCallback }
 */
function formatUnorderedList (elem, fn, options) {
  // if this list is a child of a list-item,
  // ensure that an additional line break is inserted
  const parentName = get(elem, 'parent.name');
  let result = parentName === 'li' ? '\n' : '';
  const prefix = options.unorderedListItemPrefix;
  const nonWhiteSpaceChildren = (elem.children || []).filter(function (child) {
    return child.type !== 'text' || !WHITE_SPACES_ONLY_REGEX.test(child.data);
  });
  for (const childElem of nonWhiteSpaceChildren) {
    result += formatListItem(prefix, childElem, fn, options);
  }
  return result + '\n';
}

/**
 * Convert an ordered list to a plain string.
 *
 * @type { FormatCallback }
 */
function formatOrderedList (elem, fn, options) {
  const nestedList = get(elem, 'parent.name') === 'li';
  let result = nestedList ? '\n' : '';
  const nonWhiteSpaceChildren = (elem.children || []).filter(function (child) {
    return child.type !== 'text' || !WHITE_SPACES_ONLY_REGEX.test(child.data);
  });
  // Return different functions for different OL types
  const typeFunction = (function () {
    // Determine type
    const olType = elem.attribs.type || '1';
    // TODO Imeplement the other valid types
    //   Fallback to type '1' function for other valid types
    switch (olType) {
      case 'a': return function (start, i) { return String.fromCharCode(i + start + 97); };
      case 'A': return function (start, i) { return String.fromCharCode(i + start + 65); };
      case '1':
      default: return function (start, i) { return i + start + 1; };
    }
  }());
  // Make sure there are list items present
  if (nonWhiteSpaceChildren.length) {
    // Calculate initial start from ol attribute
    const start = Number(elem.attribs.start || '1') - 1;
    // Calculate the maximum length to i.
    const maxLength = (nonWhiteSpaceChildren.length + start).toString().length;
    for (const [i, childElem] of nonWhiteSpaceChildren.entries()) {
      // Use different function depending on type
      const index = typeFunction(start, i);
      // Calculate the needed spacing for nice indentation.
      const spacing = maxLength - index.toString().length;
      const prefix = (nestedList ? '' : ' ') + index + '. ' + ' '.repeat(spacing);
      result += formatListItem(prefix, childElem, fn, options);
    }
  }
  return result + '\n';
}

/**
 * Given prepared cell contents, compute column widths and return a fully formatted text table.
 *
 * @param { string[][] } table Collection of already stringified cells.
 * @returns { string }         Fully formatted text table.
 */
function tableToString (table) {
  // Determine space width per column
  // Convert all rows to lengths
  let widths = table.map(function (row) {
    return row.map(function (col) {
      return col.length;
    });
  });
  // Invert rows with colums
  widths = zip(...widths);
  // Determine the max values for each column
  widths = widths.map(function (col) {
    return max(col);
  });

  // Build the table
  let text = '';
  for (const row of table) {
    let i = 0;
    for (const col of row) {
      text += col.trim().padEnd(widths[i++], ' ') + '   ';
    }
    text += '\n';
  }
  return text + '\n';
}

function containsTable (attr, tables) {
  if (tables === true) { return true; }

  function removePrefix (key) {
    return key.substr(1);
  }
  function checkPrefix (prefix) {
    return function (key) {
      return key.startsWith(prefix);
    };
  }
  function filterByPrefix (tables, prefix) {
    return tables
      .filter(checkPrefix(prefix))
      .map(removePrefix);
  }
  const classes = filterByPrefix(tables, '.');
  const ids = filterByPrefix(tables, '#');
  return attr && (classes.includes(attr['class']) || ids.includes(attr['id']));
}

/**
 * Convert a table to a plain string (either as a container or as a data table).
 *
 * @type { FormatCallback }
 */
function formatTable (elem, fn, options) {
  return containsTable(elem.attribs, options.tables)
    ? formatDataTable(elem, fn, options)
    : formatChildren(elem, fn, options);
}

/**
 * Convert a data table to a plain string.
 *
 * @type { FormatCallback }
 */
function formatDataTable (elem, fn, options) {
  const table = [];
  elem.children.forEach(tryParseRows);
  return tableToString(table);

  function tryParseRows (elem) {
    if (elem.type !== 'tag') {
      return;
    }
    switch (elem.name.toLowerCase()) {
      case 'thead':
      case 'tbody':
      case 'tfoot':
      case 'center':
        elem.children.forEach(tryParseRows);
        return;

      case 'tr': {
        let rows = [];
        elem.children.forEach(function (childElem) {
          if (childElem.type === 'tag') {
            switch (childElem.name.toLowerCase()) {
              case 'th': {
                const tokens = formatHeading(childElem, fn, options).split('\n');
                rows.push(compact(tokens));
                break;
              }

              case 'td': {
                const tokens = fn(childElem.children, options).split('\n');
                rows.push(compact(tokens));
                // Fill colspans with empty values
                if (childElem.attribs && childElem.attribs.colspan) {
                  const count = childElem.attribs.colspan - 1 || 0;
                  times(count, function () {
                    rows.push(['']);
                  });
                }
                break;
              }

              default:
                // do nothing
            }
          }
        });
        rows = zip(...rows);
        for (let row of rows) {
          row = row.map(function (col) { return col || ''; });
          table.push(row);
        }
        break;
      }

      default:
        // do nothing
    }
  }
}

/**
 * Convert a blockquote to a plain string.
 *
 * @type { FormatCallback }
 */
function formatBlockquote (elem, fn, options) {
  // Trim leading/trailing whitespace around blockquotes
  const text = fn(elem.children, options).trim();
  return '> ' + text.replace(/(?:\n)/g, '\n> ') + '\n';
}

module.exports = {
  anchor: formatAnchor,
  blockquote: formatBlockquote,
  children: formatChildren,
  heading: formatHeading,
  horizontalLine: formatHorizontalLine,
  image: formatImage,
  lineBreak: formatLineBreak,
  orderedList: formatOrderedList,
  paragraph: formatParagraph,
  pre: formatPre,
  skip: formatSkip,
  table: formatTable,
  text: formatText,
  unorderedList: formatUnorderedList
};
