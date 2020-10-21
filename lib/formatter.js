const he = require('he');
const get = require('lodash/get');
// eslint-disable-next-line you-dont-need-lodash-underscore/trim
const trim = require('lodash/trim');
const trimStart = require('lodash/trimStart');

const { numberToLetterSequence, numberToRoman, splitClassesAndIds } = require('./helper');

// eslint-disable-next-line import/no-unassigned-import
require('./typedefs');


/**
 * Dummy formatter that discards the input and does nothing.
 *
 * @type { FormatCallback }
 */
function formatSkip (elem, walk, builder, formatOptions) {
  /* do nothing */
}

/**
 * Process an inline-level element.
 *
 * @type { FormatCallback }
 */
function formatInline (elem, walk, builder, formatOptions) {
  walk(elem.children, builder);
}

/**
 * Process a block-level container.
 *
 * @type { FormatCallback }
 */
function formatBlock (elem, walk, builder, formatOptions) {
  builder.openBlock(formatOptions.leadingLineBreaks);
  walk(elem.children, builder);
  builder.closeBlock(formatOptions.trailingLineBreaks);
}

/**
 * Process a line-break.
 *
 * @type { FormatCallback }
 */
function formatLineBreak (elem, walk, builder, formatOptions) {
  builder.addLineBreak();
}

/**
 * Process a `wbk` tag (word break opportunity).
 *
 * @type { FormatCallback }
 */
function formatWbr (elem, walk, builder, formatOptions) {
  builder.addWordBreakOpportunity();
}

/**
 * Process a horizontal line.
 *
 * @type { FormatCallback }
 */
function formatHorizontalLine (elem, walk, builder, formatOptions) {
  builder.openBlock(formatOptions.leadingLineBreaks || 2);
  builder.addInline('-'.repeat(formatOptions.length || builder.options.wordwrap || 40));
  builder.closeBlock(formatOptions.trailingLineBreaks || 2);
}

/**
 * Process a paragraph.
 *
 * @type { FormatCallback }
 */
function formatParagraph (elem, walk, builder, formatOptions) {
  builder.openBlock(formatOptions.leadingLineBreaks || 2);
  walk(elem.children, builder);
  builder.closeBlock(formatOptions.trailingLineBreaks || 2);
}

/**
 * Process a preformatted content.
 *
 * @type { FormatCallback }
 */
function formatPre (elem, walk, builder, formatOptions) {
  builder.openBlock(formatOptions.leadingLineBreaks || 2, 0, true);
  walk(elem.children, builder);
  builder.closeBlock(formatOptions.trailingLineBreaks || 2);
}

/**
 * Process a heading.
 *
 * @type { FormatCallback }
 */
function formatHeading (elem, walk, builder, formatOptions) {
  builder.openBlock(formatOptions.leadingLineBreaks || 2);
  if (formatOptions.uppercase !== false) {
    builder.pushWordTransform(str => str.toUpperCase());
    walk(elem.children, builder);
    builder.popWordTransform();
  } else {
    walk(elem.children, builder);
  }
  builder.closeBlock(formatOptions.trailingLineBreaks || 2);
}

/**
 * Process a blockquote.
 *
 * @type { FormatCallback }
 */
function formatBlockquote (elem, walk, builder, formatOptions) {
  builder.openBlock(formatOptions.leadingLineBreaks || 2, 2);
  walk(elem.children, builder);
  builder.closeBlock(
    formatOptions.trailingLineBreaks || 2,
    str => ((formatOptions.trimEmptyLines !== false) ? trim(str, '\n') : str)
      .split('\n')
      .map(line => '> ' + line)
      .join('\n')
  );
}

/**
 * Process an image.
 *
 * @type { FormatCallback }
 */
function formatImage (elem, walk, builder, formatOptions) {
  const attribs = elem.attribs || {};
  const alt = (attribs.alt)
    ? he.decode(attribs.alt, builder.options.decodeOptions)
    : '';
  const src = (!attribs.src)
    ? ''
    : (formatOptions.baseUrl && attribs.src.indexOf('/') === 0)
      ? formatOptions.baseUrl + attribs.src
      : attribs.src;
  const text = (!src)
    ? alt
    : (!alt)
      ? '[' + src + ']'
      : alt + ' [' + src + ']';

  builder.addInline(text);
}

/**
 * Process an anchor.
 *
 * @type { FormatCallback }
 */
function formatAnchor (elem, walk, builder, formatOptions) {
  function getHref () {
    if (formatOptions.ignoreHref) { return ''; }
    if (!elem.attribs || !elem.attribs.href) { return ''; }
    let href = elem.attribs.href.replace(/^mailto:/, '');
    if (formatOptions.noAnchorUrl && href[0] === '#') { return ''; }
    href = (formatOptions.baseUrl && href[0] === '/')
      ? formatOptions.baseUrl + href
      : href;
    return he.decode(href, builder.options.decodeOptions);
  }
  const href = getHref();
  if (!href) {
    walk(elem.children, builder);
  } else {
    let text = '';
    builder.pushWordTransform(
      str => {
        if (str) { text += str; }
        return str;
      }
    );
    walk(elem.children, builder);
    builder.popWordTransform();

    const hideSameLink = formatOptions.hideLinkHrefIfSameAsText && href === text;
    if (!hideSameLink) {
      builder.addInline(
        (!text)
          ? href
          : (formatOptions.noLinkBrackets)
            ? ' ' + href
            : ' [' + href + ']',
        true
      );
    }
  }
}

/**
 * @param { DomNode }           elem               List items with their prefixes.
 * @param { RecursiveCallback } walk               Recursive callback to process child nodes.
 * @param { BlockTextBuilder }  builder            Passed around to accumulate output text.
 * @param { FormatOptions }     formatOptions      Options specific to a formatter.
 * @param { () => string }      nextPrefixCallback Function that returns inreasing index each time it is called.
 */
function formatList (elem, walk, builder, formatOptions, nextPrefixCallback) {
  const isNestedList = get(elem, 'parent.name') === 'li';

  // With Roman numbers, index length is not as straightforward as with Arabic numbers or letters,
  // so the dumb length comparison is the most robust way to get the correct value.
  let maxPrefixLength = 0;
  const listItems = (elem.children || [])
    // it might be more accuurate to check only for html spaces here, but no significant benefit
    .filter(child => child.type !== 'text' || !/^\s*$/.test(child.data))
    .map(function (child) {
      if (child.name !== 'li') {
        return { node: child, prefix: '' };
      }
      const prefix = (isNestedList)
        ? trimStart(nextPrefixCallback())
        : nextPrefixCallback();
      if (prefix.length > maxPrefixLength) { maxPrefixLength = prefix.length; }
      return { node: child, prefix: prefix };
    });
  if (!listItems.length) { return; }

  const reservedWidth = maxPrefixLength;
  const spacing = '\n' + ' '.repeat(reservedWidth);
  builder.openBlock(isNestedList ? 1 : (formatOptions.leadingLineBreaks || 2));
  for (const { node, prefix } of listItems) {
    builder.openBlock(1, reservedWidth);
    walk([node], builder);
    builder.closeBlock(
      1,
      str => prefix + ' '.repeat(reservedWidth - prefix.length) + str.replace(/\n/g, spacing)
    );
  }
  builder.closeBlock(isNestedList ? 1 : (formatOptions.trailingLineBreaks || 2));
}

/**
 * Process an unordered list.
 *
 * @type { FormatCallback }
 */
function formatUnorderedList (elem, walk, builder, formatOptions) {
  const prefix = formatOptions.itemPrefix || ' * ';
  return formatList(elem, walk, builder, formatOptions, () => prefix);
}

/**
 * Process an ordered list.
 *
 * @type { FormatCallback }
 */
function formatOrderedList (elem, walk, builder, formatOptions) {
  let nextIndex = Number(elem.attribs.start || '1');
  const indexFunction = getOrderedListIndexFunction(elem.attribs.type);
  const nextPrefixCallback = () => ' ' + indexFunction(nextIndex++) + '. ';
  return formatList(elem, walk, builder, formatOptions, nextPrefixCallback);
}

/**
 * Return a function that can be used to generate index markers of a specified format.
 *
 * @param   { string } [olType='1'] Marker type.
 * @returns { (i: number) => string }
 */
function getOrderedListIndexFunction (olType = '1') {
  switch (olType) {
    case 'a': return (i) => numberToLetterSequence(i, 'a');
    case 'A': return (i) => numberToLetterSequence(i, 'A');
    case 'i': return (i) => numberToRoman(i).toLowerCase();
    case 'I': return (i) => numberToRoman(i);
    case '1':
    default: return (i) => (i).toString();
  }
}

function isDataTable (attr, tables) {
  if (tables === true) { return true; }
  if (!attr) { return false; }

  const { classes, ids } = splitClassesAndIds(tables);
  const attrClasses = (attr['class'] || '').split(' ');
  const attrIds = (attr['id'] || '').split(' ');

  return attrClasses.some(x => classes.includes(x)) || attrIds.some(x => ids.includes(x));
}

/**
 * Process a table (either as a container or as a data table, depending on options).
 *
 * @type { FormatCallback }
 */
function formatTable (elem, walk, builder, formatOptions) {
  return isDataTable(elem.attribs, builder.options.tables)
    ? formatDataTable(elem, walk, builder, formatOptions)
    : formatBlock(elem, walk, builder, formatOptions);
}

/**
 * Process a data table.
 *
 * @type { FormatCallback }
 */
function formatDataTable (elem, walk, builder, formatOptions) {
  builder.openTable();
  elem.children.forEach(walkTable);
  builder.closeTable(
    formatOptions.colSpacing,
    formatOptions.rowSpacing,
    formatOptions.leadingLineBreaks,
    formatOptions.trailingLineBreaks
  );

  function formatCell (cellNode) {
    const colspan = +get(cellNode, 'attribs.colspan') || 1;
    const rowspan = +get(cellNode, 'attribs.rowspan') || 1;
    builder.openTableCell(formatOptions.maxColumnWidth);
    walk(cellNode.children, builder);
    builder.closeTableCell(colspan, rowspan);
  }

  function walkTable (elem) {
    if (elem.type !== 'tag') { return; }

    const formatHeaderCell = (formatOptions.uppercaseHeaderCells)
      ? (cellNode) => {
        builder.pushWordTransform(str => str.toUpperCase());
        formatCell(cellNode);
        builder.popWordTransform();
      }
      : formatCell;

    switch (elem.name) {
      case 'thead':
      case 'tbody':
      case 'tfoot':
      case 'center':
        elem.children.forEach(walkTable);
        return;

      case 'tr': {
        builder.openTableRow();
        for (const childOfTr of elem.children) {
          if (childOfTr.type !== 'tag') { continue; }
          switch (childOfTr.name) {
            case 'th': {
              formatHeaderCell(childOfTr);
              break;
            }
            case 'td': {
              formatCell(childOfTr);
              break;
            }
            default:
              // do nothing
          }
        }
        builder.closeTableRow();
        break;
      }

      default:
        // do nothing
    }
  }
}

module.exports = {
  anchor: formatAnchor,
  block: formatBlock,
  blockquote: formatBlockquote,
  dataTable: formatDataTable,
  heading: formatHeading,
  horizontalLine: formatHorizontalLine,
  image: formatImage,
  inline: formatInline,
  lineBreak: formatLineBreak,
  orderedList: formatOrderedList,
  paragraph: formatParagraph,
  pre: formatPre,
  skip: formatSkip,
  table: formatTable,
  unorderedList: formatUnorderedList,
  wbr: formatWbr
};
