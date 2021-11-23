
const render = require('dom-serializer').default;

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

function renderOpenTag (elem) {
  const attrs = (elem.attribs && elem.attribs.length)
    ? ' ' + Object.entries(elem.attribs)
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
  builder.startNoWrap();
  builder.addInline(renderOpenTag(elem), { noWordTransform: true });
  builder.stopNoWrap();
  walk(elem.children, builder);
  builder.startNoWrap();
  builder.addInline(renderCloseTag(elem), { noWordTransform: true });
  builder.stopNoWrap();
}

/**
 * Render an element as HTML block bag, walk through it's children.
 *
 * @type { FormatCallback }
 */
function formatBlockTag (elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.startNoWrap();
  builder.addInline(renderOpenTag(elem), { noWordTransform: true });
  builder.stopNoWrap();
  walk(elem.children, builder);
  builder.startNoWrap();
  builder.addInline(renderCloseTag(elem), { noWordTransform: true });
  builder.stopNoWrap();
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

/**
 * Render an element with all it's children as inline HTML.
 *
 * @type { FormatCallback }
 */
function formatInlineHtml (elem, walk, builder, formatOptions) {
  builder.startNoWrap();
  builder.addInline(
    render(elem, { decodeEntities: builder.options.decodeEntities }),
    { noWordTransform: true }
  );
  builder.stopNoWrap();
}

/**
 * Render an element with all it's children as HTML block.
 *
 * @type { FormatCallback }
 */
function formatBlockHtml (elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.startNoWrap();
  builder.addInline(
    render(elem, { decodeEntities: builder.options.decodeEntities }),
    { noWordTransform: true }
  );
  builder.stopNoWrap();
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

/**
 * Render inline element wrapped with given strings.
 *
 * @type { FormatCallback }
 */
function formatInlineSurround (elem, walk, builder, formatOptions) {
  builder.addInline(formatOptions.prefix || '', { noWordTransform: true });
  walk(elem.children, builder);
  builder.addInline(formatOptions.suffix || '', { noWordTransform: true });
}


module.exports = {
  block: formatBlock,
  blockHtml: formatBlockHtml,
  blockString: formatBlockString,
  blockTag: formatBlockTag,
  inline: formatInline,
  inlineHtml: formatInlineHtml,
  inlineString: formatInlineString,
  inlineSurround: formatInlineSurround,
  inlineTag: formatInlineTag,
  skip: formatSkip,
};
