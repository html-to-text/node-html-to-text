# html-to-text

[![lint status](https://github.com/html-to-text/node-html-to-text/workflows/lint/badge.svg)](https://github.com/html-to-text/node-html-to-text/actions/workflows/lint.yml)
[![test status](https://github.com/html-to-text/node-html-to-text/workflows/test/badge.svg)](https://github.com/html-to-text/node-html-to-text/actions/workflows/test.yml)
[![Test Coverage](https://codeclimate.com/github/html-to-text/node-html-to-text/badges/coverage.svg)](https://codeclimate.com/github/html-to-text/node-html-to-text/coverage)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/html-to-text/node-html-to-text/blob/master/LICENSE-MIT)
[![npm](https://img.shields.io/npm/v/html-to-text?logo=npm)](https://www.npmjs.com/package/html-to-text)
[![npm](https://img.shields.io/npm/dw/html-to-text?color=informational&logo=npm)](https://www.npmjs.com/package/html-to-text)

Advanced converter that parses HTML and returns beautiful text.

## Features

* Inline and block-level tags.
* Tables with colspans and rowspans.
* Links with both text and href.
* Word wrapping.
* Unicode support.
* Plenty of customization options.

## Changelog

Available here: [CHANGELOG.md](https://github.com/html-to-text/node-html-to-text/blob/master/CHANGELOG.md)

Version 6 contains a ton of changes, so it worth to take a look.

Version 7 contains an important change for custom formatters.

Version 8 brings the selectors support to greatly increase the flexibility but that also changes some things introduced in version 6. Base element(s) selection also got important changes.

## Installation

```
npm install html-to-text
```

## Usage

Convert a single document:

```js
const { convert } = require('html-to-text');
// There is also an alias to `convert` called `htmlToText`.

const html = '<h1>Hello World</h1>';
const text = convert(html, {
  wordwrap: 130
});
console.log(text); // Hello World
```

Configure `html-to-text` once for batch processing:

```js
const { compile } = require('html-to-text');

const convert = compile({
  wordwrap: 130
});

const htmls = [
  '<h1>Hello World!</h1>',
  '<h1>こんにちは世界！</h1>',
  '<h1>Привет, мир!</h1>'
];
const texts = htmls.map(convert);
console.log(texts.join('\n'));
// Hello World!
// こんにちは世界！
// Привет, мир!
```

### Options

#### General options

Option                  | Default      | Description
----------------------- | ------------ | -----------
`baseElements`          |              | Describes which parts of the input document have to be converted and present in the output text, and in what order.
`baseElements.selectors` | `['body']`  | Elements matching any of provided selectors will be processed and included in the output text, with all inner content.<br/>Refer to [Supported selectors](#supported-selectors) section below.
`baseElements.orderBy`  | `'selectors'` | `'selectors'` - arrange base elements in the same order as `baseElements.selectors` array;<br/>`'occurrence'` - arrange base elements in the order they are found in the input document.
`baseElements.returnDomByDefault` | `true` | Convert the entire document if none of provided selectors match.
`decodeOptions`         | `{ isAttributeValue: false, strict: false }` | Text decoding options given to `he.decode`. For more information see the [he](https://github.com/mathiasbynens/he) module.
`formatters`            | `{}`         | An object with custom formatting functions for specific elements (see [Override formatting](#override-formatting) section below).
`limits`                |              | Describes how to limit the output text in case of large HTML documents.
`limits.ellipsis`       | `'...'`      | A string to insert in place of skipped content.
`limits.maxBaseElements` | `undefined` | Stop looking for more base elements after reaching this amount. Unlimited if undefined.
`limits.maxChildNodes`  | `undefined`  | Maximum number of child nodes of a single node to be added to the output. Unlimited if undefined.
`limits.maxDepth`       | `undefined`  | Stop looking for nodes to add to the output below this depth in the DOM tree. Unlimited if undefined.
`limits.maxInputLength` | `16_777_216` | If the input string is longer than this value - it will be truncated and a message will be sent to `stderr`. Ellipsis is not used in this case. Unlimited if undefined.
`longWordSplit`         |              | Describes how to wrap long words.
`longWordSplit.wrapCharacters` | `[]`  | An array containing the characters that may be wrapped on. Checked in order, search stops once line length requirement can be met.
`longWordSplit.forceWrapOnLimit` | `false` | Break long words at the line length limit in case no better wrap opportunities found.
`preserveNewlines`      | `false`      | By default, any newlines `\n` from the input HTML are collapsed into space as any other HTML whitespace characters. If `true`, these newlines will be preserved in the output. This is only useful when input HTML carries some plain text formatting instead of proper tags.
`selectors`             | `[]`         | Describes how different HTML elements should be formatted. See [Selectors](#selectors) section below.
`whitespaceCharacters`  | `' \t\r\n\f\u200b'` | A string of characters that are recognized as HTML whitespace. Default value uses the set of characters defined in [HTML4 standard](https://www.w3.org/TR/html4/struct/text.html#h-9.1). (It includes Zero-width space compared to [living standard](https://infra.spec.whatwg.org#ascii-whitespace).)
`wordwrap`              | `80`         | After how many chars a line break should follow.<br/>Set to `null` or `false` to disable word-wrapping.

#### Deprecated or removed options

Old&nbsp;option          | Depr. | Rem.  | Instead&nbsp;use
-------------------------- | --- | ----- | -----------------
`baseElement`              | 8.0 |       | `baseElements: { selectors: [ 'body' ] }`
`format`                   |     |  6.0  | The way formatters are written has changed completely. New formatters have to be added to the `formatters` option, old ones can not be reused without rewrite. See [new instructions](#override-formatting) below.
`hideLinkHrefIfSameAsText` | 6.0 | *9.0* | `selectors: [ { selector: 'a', options: { hideLinkHrefIfSameAsText: true } } ]`
`ignoreHref`               | 6.0 | *9.0* | `selectors: [ { selector: 'a', options: { ignoreHref: true } } ]`
`ignoreImage`              | 6.0 | *9.0* | `selectors: [ { selector: 'img', format: 'skip' } ]`
`linkHrefBaseUrl`          | 6.0 | *9.0* | `selectors: [`<br/>`{ selector: 'a', options: { baseUrl: 'https://example.com' } },`<br/>`{ selector: 'img', options: { baseUrl: 'https://example.com' } }`<br/>`]`
`noAnchorUrl`              | 6.0 | *9.0* | `selectors: [ { selector: 'a', options: { noAnchorUrl: true } } ]`
`noLinkBrackets`           | 6.0 | *9.0* | `selectors: [ { selector: 'a', options: { linkBrackets: false } } ]`
`returnDomByDefault`       | 8.0 |       | `baseElements: { returnDomByDefault: true }`
`singleNewLineParagraphs`  | 6.0 | *9.0* | `selectors: [`<br/>`{ selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },`<br/>`{ selector: 'pre', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }`<br/>`]`
`tables`                   | 8.0 |       | `selectors: [ { selector: 'table.class#id', format: 'dataTable' } ]`
`tags`                     | 8.0 |       | See [Selectors](#selectors) section below.
`unorderedListItemPrefix`  | 6.0 | *9.0* | `selectors: [ { selector: 'ul', options: { itemPrefix: ' * ' } } ]`
`uppercaseHeadings`        | 6.0 | *9.0* | `selectors: [`<br/>`{ selector: 'h1', options: { uppercase: false } },`<br/>`...`<br/>`{ selector: 'table', options: { uppercaseHeaderCells: false } }`<br/>`]`

Other things deprecated:

* `fromString` method;
* positional arguments in `BlockTextBuilder` methods (in case you have written some custom formatters for version 6.0).

#### Selectors

Some example:

```javascript
const { convert } = require('html-to-text');

const html = '<a href="/page.html">Page</a><a href="!#" class="button">Action</a>';
const text = convert(html, {
  selectors: [
    { selector: 'a', options: { baseUrl: 'https://example.com' } },
    { selector: 'a.button', format: 'skip' }
  ]
});
console.log(text); // Page [https://example.com/page.html]
```

Selectors array is our loose approximation of a stylesheet.

* highest [specificity](https://www.w3.org/TR/selectors/#specificity) selector is used when there are multiple matches;
* the last selector is used when there are multiple matches of equal specificity;
* all entries with the same selector value are merged (recursively) at the compile stage, in such way so the last defined properties a kept and the relative order of unique selectors is kept;
* user-defined entries are appended after [predefined entries](#predefined-formatters);
* Every unique selector must have `format` value specified (at least once);
* unlike in CSS, values from different matched selectors are NOT merged at the convert stage. Single best match is used instead (that is the last one of those with highest specificity).

To achieve the best performance when checking each DOM element against provided selectors, they are compiled into a decision tree. But it is also important how you choose selectors. For example, `div#id` is much better than `#id` - the former will only check divs for the id while the latter has to check every element in the DOM.

##### Supported selectors

`html-to-text` relies on [parseley](https://github.com/mxxii/parseley) and [selderee](https://github.com/mxxii/selderee) packages for selectors support.

Following selectors can be used in any combinations:

* `*` - universal selector;
* `div` - tag name;
* `.foo` - class name;
* `#bar` - id;
* `[baz]` - attribute presence;
* `[baz=buzz]` - attribute value (with any operators and also quotes and case sensitivity modifiers);
* `+` and `>` combinators (other combinators are not supported).

You can match `<p style="...; display:INLINE; ...">...</p>` with `p[style*="display:inline"i]` for example.

##### Predefined formatters

Following selectors have a formatter specified as a part of the default configuration. Everything can be overridden, but you don't have to repeat the `format` or options that you don't want to override. (But keep in mind this is only true for the same selector. There is no connection between different selectors.)

Selector      | Default&nbsp;format | Notes
------------- | ------------------- | -----
`*`           | `inline`            | Universal selector.
`a`           | `anchor`            |
`article`     | `block`             |
`aside`       | `block`             |
`blockquote`  | `blockquote`        |
`br`          | `lineBreak`         |
`div`         | `block`             |
`footer`      | `block`             |
`form`        | `block`             |
`h1`          | `heading`           |
`h2`          | `heading`           |
`h3`          | `heading`           |
`h4`          | `heading`           |
`h5`          | `heading`           |
`h6`          | `heading`           |
`header`      | `block`             |
`hr`          | `horizontalLine`    |
`img`         | `image`             |
`main`        | `block`             |
`nav`         | `block`             |
`ol`          | `orderedList`       |
`p`           | `paragraph`         |
`pre`         | `pre`               |
`table`       | `table`             | Equivalent to `block`. Use `dataTable` instead for tabular data.
`ul`          | `unorderedList`     |
`wbr`         | `wbr`               |

More formatters also available for use:

* `dataTable` - for visually-accurate tables. Note that this might be not search-friendly (output text will look like gibberish to a machine when there is any wrapped cell contents) and also better to be avoided for tables used as a page layout tool;
* `skip` - as the name implies it skips the given tag with it's contents without printing anything.

##### Format options

Following options are available for built-in formatters.

Option              | Default     | Applies&nbsp;to    | Description
------------------- | ----------- | ------------------ | -----------
`leadingLineBreaks` | `1`, `2` or `3` | all block-level formatters | Number of line breaks to separate previous block from this one.<br/>Note that N+1 line breaks are needed to make N empty lines.
`trailingLineBreaks` | `1` or `2` | all block-level formatters | Number of line breaks to separate this block from the next one.<br/>Note that N+1 line breaks are needed to make N empty lines.
`baseUrl`           | `null`      | `anchor`, `image`  | Server host for link `href` attributes and image `src` attributes relative to the root (the ones that start with `/`).<br/>For example, with `baseUrl = 'http://asdf.com'` and `<a href='/dir/subdir'>...</a>` the link in the text will be `http://asdf.com/dir/subdir`.<br/>Keep in mind that `baseUrl` should not end with a `/`.
`linkBrackets`     | `['[', ']']` | `anchor`, `image`  | Surround links with these brackets.<br/>Set to `false` or `['', '']` to disable.
`hideLinkHrefIfSameAsText` | `false` | `anchor`        | By default links are translated in the following way:<br/>`<a href='link'>text</a>` => becomes => `text [link]`.<br/>If this option is set to `true` and `link` and `text` are the same, `[link]` will be omitted and only `text` will be present.
`ignoreHref`        | `false`     | `anchor`           | Ignore all links. Only process internal text of anchor tags.
`noAnchorUrl`       | `true`      | `anchor`           | Ignore anchor links (where `href='#...'`).
`itemPrefix`        | `' * '`     | `unorderedList`    | String prefix for each list item.
`uppercase`         | `true`      | `heading`          | By default, headings (`<h1>`, `<h2>`, etc) are uppercased.<br/>Set this to `false` to leave headings as they are.
`length`            | `undefined` | `horizontalLine`   | Length of the line. If undefined then `wordwrap` value is used. Falls back to 40 if that's also disabled.
`trimEmptyLines`    | `true`      | `blockquote`       | Trim empty lines from blockquote.<br/>While empty lines should be preserved in HTML, space-saving behavior is chosen as default for convenience.
`uppercaseHeaderCells` | `true`   | `dataTable`        | By default, heading cells (`<th>`) are uppercased.<br/>Set this to `false` to leave heading cells as they are.
`maxColumnWidth`    | `60`        | `dataTable`        | Data table cell content will be wrapped to fit this width instead of global `wordwrap` limit.<br/>Set this to `undefined` in order to fall back to `wordwrap` limit.
`colSpacing`        | `3`         | `dataTable`        | Number of spaces between data table columns.
`rowSpacing`        | `0`         | `dataTable`        | Number of empty lines between data table rows.

##### Deprecated format options

Old option          | Applies&nbsp;to    | Depr. | Rem. | Instead use
------------------- | ------------------ | ----- | ---- | ---------------------
`noLinkBrackets`    | `anchor`           | 8.1   |      | `linkBrackets: false`

### Override formatting

This is significantly changed in version 6.

`formatters` option is an object that holds formatting functions. They can be assigned to format different elements in the `selectors` array.

Each formatter is a function of four arguments that returns nothing. Arguments are:

* `elem` - the HTML element to be processed by this formatter;
* `walk` - recursive function to process the children of this element. Called as `walk(elem.children, builder)`;
* `builder` - [BlockTextBuilder](https://github.com/html-to-text/node-html-to-text/blob/master/lib/block-text-builder.js) object. Manipulate this object state to build the output text;
* `formatOptions` - options that are specified for a tag, along with this formatter (Note: if you need general html-to-text [options](#general-options) - they are accessible via `builder.options`).

Custom formatter example:

```javascript
const { convert } = require('html-to-text');

const html = '<foo>Hello World</foo>';
const text = convert(html, {
  formatters: {
    // Create a formatter.
    'fooBlockFormatter': function (elem, walk, builder, formatOptions) {
      builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 1 });
      walk(elem.children, builder);
      builder.addInline('!');
      builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 1 });
    }
  },
  selectors: [
    // Assign it to `foo` tags.
    {
      selector: 'foo',
      format: 'fooBlockFormatter',
      options: { leadingLineBreaks: 1, trailingLineBreaks: 1 }
    }
  ]
});
console.log(text); // Hello World!
```

Refer to [built-in formatters](https://github.com/html-to-text/node-html-to-text/blob/master/lib/formatter.js) for more examples. The easiest way to write your own is to pick an existing one and customize.

Refer to [BlockTextBuilder](https://github.com/html-to-text/node-html-to-text/blob/master/lib/block-text-builder.js) for available functions and arguments.

Note: `BlockTextBuilder` got some important [changes](https://github.com/html-to-text/node-html-to-text/commit/f50f10f54cf814efb2f7633d9d377ba7eadeaf1e) in the version 7. Positional arguments are deprecated and formatters written for the version 6 have to be updated accordingly in order to keep working after next major update.

## Command Line Interface

It is possible to use html-to-text as command line interface. This allows an easy validation of your generated text and the integration in other systems that does not run on node.js.

`html-to-text` uses `stdin` and `stdout` for data in and output. So you can use `html-to-text` the following way:

```
cat example/test.html | html-to-text > test.txt
```

There also all options available as described above. You can use them like this:

```
cat example/test.html | html-to-text --tables=#invoice,.address --wordwrap=100 > test.txt
```

The `tables` option has to be declared as comma separated list without whitespaces.

## Example

* Input text: [test.html](https://github.com/html-to-text/node-html-to-text/blob/master/test/test.html)
* Output text: [test.txt](https://github.com/html-to-text/node-html-to-text/blob/master/test/test.txt)

## Contributors

* [@mlegenhausen](https://github.com/mlegenhausen) - creator;
* [@KillyMXI](https://github.com/KillyMXI) - maintainer since 2020;
* Everyone else who [added something](https://github.com/html-to-text/node-html-to-text/graphs/contributors) to the tool or helped us shaping it via [issues](https://github.com/html-to-text/node-html-to-text/issues) and [PRs](https://github.com/html-to-text/node-html-to-text/pulls).

## License

[MIT License](https://github.com/html-to-text/node-html-to-text/blob/master/LICENSE-MIT)
