
const { get, numberToLetterSequence, numberToRoman, trimCharacter } = require('@html-to-text/base/src/util');
const render = require('dom-serializer').default;
const { innerText } = require('domutils');

// eslint-disable-next-line import/no-unassigned-import
require('@html-to-text/base/src/typedefs');


/**
 * Dummy formatter that throws an error.
 *
 * @type { FormatCallback }
 */
function formatFail (elem, walk, builder, formatOptions) {
  console.error(`Unhandled: ${elem.name}`);
  throw new Error(formatOptions.message || 'fail');
}

/**
 * Dummy formatter that discards the input and does nothing.
 *
 * @type { FormatCallback }
 */
function formatSkip (elem, walk, builder, formatOptions) {
  /* do nothing */
}

/**
 * Insert the given string inline instead of a tag.
 *
 * @type { FormatCallback }
 */
function formatInlineString (elem, walk, builder, formatOptions) {
  builder.addInline(formatOptions.string || '', { noWordTransform: true });
}

/**
 * Insert a block with the given string instead of a tag.
 *
 * @type { FormatCallback }
 */
function formatBlockString (elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addInline(formatOptions.string || '', { noWordTransform: true });
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
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
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

function renderOpenTag (elem, decodeEntities) {
  const attrs = (elem.attribs && elem.attribs.length)
    ? ' ' + Object
      .entries(elem.attribs)
      .map(([k, v]) => ((v === '') ? k : `${k}=${v.replace(/"/g, '&quot;')}`))
      .join(' ')
    : '';
  return `<${elem.name}${attrs}>`;
}

function renderCloseTag (elem) {
  return `</${elem.name}>`;
}

/**
 * Render an element as inline HTML tag, walk through it's children.
 *
 * @type { FormatCallback }
 */
function formatInlineTag (elem, walk, builder, formatOptions) {
  builder.addInline(renderOpenTag(elem, builder.options.decodeEntities), { noWordTransform: true });
  walk(elem.children, builder);
  builder.addInline(renderCloseTag(elem), { noWordTransform: true });
}

/**
 * Render an element as HTML block bag, walk through it's children.
 *
 * @type { FormatCallback }
 */
function formatBlockTag (elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addInline(renderOpenTag(elem, builder.options.decodeEntities), { noWordTransform: true });
  walk(elem.children, builder);
  builder.addInline(renderCloseTag(elem), { noWordTransform: true });
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

/**
 * Render an element with all it's children as inline HTML.
 *
 * @type { FormatCallback }
 */
function formatInlineHtml (elem, walk, builder, formatOptions) {
  builder.addInline(
    render(elem, { decodeEntities: builder.options.decodeEntities }),
    { noWordTransform: true }
  );
}

/**
 * Render an element with all it's children as HTML block.
 *
 * @type { FormatCallback }
 */
function formatBlockHtml (elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addInline(
    render(elem, { decodeEntities: builder.options.decodeEntities }),
    { noWordTransform: true }
  );
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

/**
 * Render inline element wrapped with given strings.
 *
 * @type { FormatCallback }
 */
function formatInlineWrap (elem, walk, builder, formatOptions) {
  builder.addInline(formatOptions.prefix || '', { noWordTransform: true });
  walk(elem.children, builder);
  builder.addInline(formatOptions.suffix || '', { noWordTransform: true });
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
 * Process a preformatted content.
 *
 * @type { FormatCallback }
 */
function formatPre (elem, walk, builder, formatOptions) {
  builder.openBlock({
    isPre: true,
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
    reservedLineLength: 2
  });
  walk(elem.children, builder);
  builder.closeBlock({
    trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
    blockTransform: str => str
      .split('\n')
      .map(line => '    ' + line)
      .join('\n')
  });
}

/**
 * Process a heading.
 *
 * @type { FormatCallback }
 */
function formatHeading (elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addInline('#'.repeat(formatOptions.level || 1) + ' ', { noWordTransform: true });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

/**
 * Process a blockquote.
 *
 * @type { FormatCallback }
 */
function formatBlockquote (elem, walk, builder, formatOptions) {
  builder.openBlock({
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
    reservedLineLength: 2
  });
  walk(elem.children, builder);
  builder.closeBlock({
    trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
    blockTransform: str => ((formatOptions.trimEmptyLines !== false) ? trimCharacter(str, '\n') : str)
      .split('\n')
      .map(line => '> ' + line)
      .join('\n')
  });
}

/**
 * Render code block.
 *
 * @type { FormatCallback }
 */
function formatCodeBlock (elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addInline('```' + (formatOptions.language || ''), { noWordTransform: true });
  builder.addLineBreak();
  walk(elem.children, builder);
  builder.addLineBreak();
  builder.addInline('```', { noWordTransform: true });
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

/**
 * Process an image.
 *
 * @type { FormatCallback }
 */
function formatImage (elem, walk, builder, formatOptions) {
  const attribs = elem.attribs || {};
  if (attribs.src && attribs.src.startsWith('data:')) {
    builder.addInline(
      render(elem, { decodeEntities: builder.options.decodeEntities }),
      { noWordTransform: true }
    );
    return;
  }
  const alt = (attribs.alt)
    ? attribs.alt
    : '';
  const title = (attribs.title)
    ? ` "${attribs.title}"`
    : '';
  const src = (!attribs.src) // TODO: url overwrite function
    ? ''
    : (formatOptions.baseUrl && attribs.src[0] === '/')
      ? formatOptions.baseUrl + attribs.src
      : attribs.src;
  builder.addInline(`![`, { noWordTransform: true });
  builder.addInline(alt);
  builder.addInline(`](${src}`, { noWordTransform: true });
  builder.addInline(title);
  builder.addInline(`)`, { noWordTransform: true }); // TODO: noWrap
}

/**
 * Process a link/anchor.
 *
 * @type { FormatCallback }
 */
function formatAnchor (elem, walk, builder, formatOptions) {
  function getHref () {
    if (!elem.attribs || !elem.attribs.href) { return ''; }
    let href = elem.attribs.href;
    if (formatOptions.noAnchorUrl && href[0] === '#') {
      // TODO: <a name="foo"></a> anchor or [](){:name='foo'}
    }
    href = (formatOptions.baseUrl && href[0] === '/') // TODO: url overwrite function
      ? formatOptions.baseUrl + href
      : href;
    return href;
  }
  const href = getHref();
  const title = ''; // TODO: title
  if (!href) {
    walk(elem.children, builder);
  } else {
    const text = innerText(elem);
    if (href === text) {
      builder.addInline(`<${href}>`, { noWordTransform: true });
    } else {
      builder.addInline(`[`, { noWordTransform: true });
      walk(elem.children, builder);
      builder.addInline(`](${href}`, { noWordTransform: true });
      builder.addInline(`${title}`);
      builder.addInline(`)`, { noWordTransform: true }); // TODO: noWrap
    }
  }
}

/**
 * @param { DomNode }           elem               List items with their prefixes.
 * @param { RecursiveCallback } walk               Recursive callback to process child nodes.
 * @param { BlockTextBuilder }  builder            Passed around to accumulate output text.
 * @param { FormatOptions }     formatOptions      Options specific to a formatter.
 * @param { () => string }      nextPrefixCallback Function that returns increasing index each time it is called.
 */
function formatList (elem, walk, builder, formatOptions, nextPrefixCallback) {
  const isNestedList = get(elem, ['parent', 'name']) === 'li';

  // With Roman numbers, index length is not as straightforward as with Arabic numbers or letters,
  // so the dumb length comparison is the most robust way to get the correct value.
  let maxPrefixLength = 0;
  const listItems = (elem.children || [])
    // it might be more accurate to check only for html spaces here, but no significant benefit
    .filter(child => child.type !== 'text' || !/^\s*$/.test(child.data))
    .map(function (child) {
      if (child.name !== 'li') {
        return { node: child, prefix: '' };
      }
      const prefix = (isNestedList)
        ? nextPrefixCallback().trimStart()
        : nextPrefixCallback();
      if (prefix.length > maxPrefixLength) { maxPrefixLength = prefix.length; }
      return { node: child, prefix: prefix };
    });
  if (!listItems.length) { return; }

  builder.openList({
    interRowLineBreaks: formatOptions.interRowLineBreaks || 1,
    leadingLineBreaks: isNestedList ? 1 : (formatOptions.leadingLineBreaks || 2),
    maxPrefixLength: maxPrefixLength,
    prefixAlign: 'left'
  });

  for (const { node, prefix } of listItems) {
    builder.openListItem({ prefix: prefix });
    walk([node], builder);
    builder.closeListItem();
  }

  builder.closeList({ trailingLineBreaks: isNestedList ? 1 : (formatOptions.trailingLineBreaks || 2) });
}

/**
 * Process an unordered list.
 *
 * @type { FormatCallback }
 */
function formatUnorderedList (elem, walk, builder, formatOptions) {
  const prefix = (formatOptions.marker || '-') + ' '; // can be any of [-*+]
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
  const nextPrefixCallback = () => indexFunction(nextIndex++) + '. ';
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

function collectDefinitionGroups (elem) {
  const defItems = [];
  function handleDtDd (el) {
    if (el.name === 'dt' || el.name === 'dd') {
      defItems.push(el);
    }
  }
  for (const child of (elem.children || [])) {
    if (child.name === 'div') {
      (child.children || []).forEach(handleDtDd);
    } else {
      handleDtDd(child);
    }
  }
  const groups = [];
  let group = null;
  for (const item of defItems) {
    if (item.name === 'dt') {
      if (group && group.definitions.length === 0) {
        group.titleItems.push(item);
      } else {
        group = { titleItems: [item], definitions: [] };
        groups.push(group);
      }
    } else { // dd
      group.definitions.push(item);
    }
  }
  return groups;
}

/**
 * Render a definition list in a form supported by some markdown systems
 * (each definition starts with ": ").
 *
 * @type { FormatCallback }
 */
function formatDefinitionList (elem, walk, builder, formatOptions) {
  const groups = collectDefinitionGroups(elem);
  for (const group of groups) {
    builder.openList({
      interRowLineBreaks: 1,
      leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
      maxPrefixLength: 0,
      prefixAlign: 'left'
    });

    for (const titleItem of group.titleItems) {
      builder.openListItem({ prefix: '' });
      walk([titleItem], builder);
      builder.closeListItem();
    }

    for (const definition of group.definitions) {
      builder.openListItem({ prefix: ': ' });
      walk([definition], builder);
      builder.closeListItem();
    }

    builder.closeList({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
  }
}

/**
 * Render a definition list in a compatible form
 * (substitute with bold titles and regular lists).
 *
 * @type { FormatCallback }
 */
function formatDefinitionListCompatible (elem, walk, builder, formatOptions) {
  const definitionPrefix = (formatOptions.marker || '*') + ' '; // can be any of [-*+]
  const groups = collectDefinitionGroups(elem);
  for (const group of groups) {
    builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });

    for (const titleItem of group.titleItems) {
      builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
      builder.addInline('**', { noWordTransform: true });
      walk(titleItem.children, builder);
      builder.addInline('**', { noWordTransform: true });
      builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
    }

    builder.openList({
      interRowLineBreaks: formatOptions.interRowLineBreaks || 1,
      leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
      maxPrefixLength: 0,
      prefixAlign: 'left'
    });

    for (const definition of group.definitions) {
      builder.openListItem({ prefix: definitionPrefix });
      walk([definition], builder);
      builder.closeListItem();
    }

    builder.closeList({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });

    builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
  }
}

// TODO: dataTable
// ...
// colspan: <td colspan> or || flavor or copy or first
// rowspan: similar

// each cell can only contain single-row content
// (replace \n*N with BR*(N-1) for N>1, replace \n with ' ')

// content representable inside table cells
// query stack (StackItem.tagName) ?
// isTable - similar to isPre ?
// separate list of selectors ? !!


/**
 * Process a data table.
 *
 * @type { FormatCallback }
 */
function formatDataTable (elem, walk, builder, formatOptions) {
  builder.openTable();
  elem.children.forEach(walkTable);
  builder.closeTable({
    colSpacing: formatOptions.colSpacing,
    leadingLineBreaks: formatOptions.leadingLineBreaks,
    rowSpacing: formatOptions.rowSpacing,
    trailingLineBreaks: formatOptions.trailingLineBreaks,
    // TODO: provide table printer implementation
  });

  function formatCell (cellNode) {
    const colspan = +get(cellNode, ['attribs', 'colspan']) || 1;
    const rowspan = +get(cellNode, ['attribs', 'rowspan']) || 1;
    builder.openTableCell({ maxColumnWidth: formatOptions.maxColumnWidth });
    walk(cellNode.children, builder);
    builder.closeTableCell({ colspan: colspan, rowspan: rowspan });
  }

  function walkTable (elem) {
    if (elem.type !== 'tag') { return; }

    const formatHeaderCell = (formatOptions.uppercaseHeaderCells !== false)
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
  blockHtml: formatBlockHtml,
  blockString: formatBlockString,
  blockTag: formatBlockTag,
  blockquote: formatBlockquote,
  codeBlock: formatCodeBlock,
  dataTable: formatDataTable,
  definitionList: formatDefinitionList,
  definitionListCompatible: formatDefinitionListCompatible,
  fail: formatFail,
  heading: formatHeading,
  image: formatImage,
  inline: formatInline,
  inlineHtml: formatInlineHtml,
  inlineString: formatInlineString,
  inlineTag: formatInlineTag,
  inlineWrap: formatInlineWrap,
  orderedList: formatOrderedList,
  pre: formatPre,
  skip: formatSkip,
  unorderedList: formatUnorderedList,
  wbr: formatWbr
};
