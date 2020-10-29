# html-to-text

[![Build Status](https://travis-ci.org/html-to-text/node-html-to-text.svg?branch=master)](https://travis-ci.org/html-to-text/node-html-to-text)
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

## Installation

```
npm install html-to-text
```

Or when you want to use it as command line interface it is recommended to install it globally via

```
npm install html-to-text -g
```

## Usage

```js
const { htmlToText } = require('html-to-text');

const text = htmlToText('<h1>Hello World</h1>', {
  wordwrap: 130
});
console.log(text); // Hello World
```

### Options

#### General options

Option                  | Default      | Description
----------------------- | ------------ | -----------
`baseElement`           | `'body'`     | The tag(s) whose text content will be captured from the html and added to the resulting text output.<br/>Single element or an array of elements can be specified, each as a single tag name with optional css class and id parameters e.g. `['p.class1.class2#id1#id2', 'p.class1.class2#id1#id2']`.
`decodeOptions`         | `{ isAttributeValue: false, strict: false }` | Text decoding options given to `he.decode`. For more informations see the [he](https://github.com/mathiasbynens/he) module.
`formatters`            | `{}`         | An object with custom formatting functions for specific elements (see "Override formatting" section below).
`limits`                |              | Describes how to limit the output text in case of large HTML documents.
`limits.ellipsis`       | `'...'`      | A string to insert in place of skipped content.
`limits.maxChildNodes`  | `undefined`  | Maximum number of child nodes of a single node to be added to the output. Unlimited if undefined.
`limits.maxDepth`       | `undefined`  | Stop looking for nodes to add to the output below this depth in the DOM tree. Unlimited if undefined.
`limits.maxInputLength` | `16_777_216` | If the input string is longer than this value - it will be truncated and a message will be sent to `stderr`. Ellipsis is not used in this case. Unlimited if undefined.
`longWordSplit`         |              | Describes how to wrap long words.
`longWordSplit.wrapCharacters` | `[]`  | An array containing the characters that may be wrapped on. Checked in order, search stops once line length requirement can be met.
`longWordSplit.forceWrapOnLimit` | `false` | Break long words at the line length limit in case no better wrap opportunities found.
`preserveNewlines`      | `false`      | By default, any newlines `\n` in a block of text will be removed. If `true`, these newlines will not be removed.
`returnDomByDefault`    | `true`       | Convert the entire document if we don't find the tag defined in `baseElement`.
`tables`                | `[]`         | Allows to select certain tables by the `class` or `id` attribute from the HTML document. This is necessary because the majority of HTML E-Mails uses a table based layout. Prefix your table selectors with an `.` for the `class` and with a `#` for the `id` attribute. All other tables are ignored.<br/>You can assign `true` to this attribute to select all tables.
`tags`                  |              | Describes how different tags should be formatted. See "Tags" section below.
`whitespaceCharacters`  | `' \t\r\n\f\u200b'` | A string of characters that are recognized as HTML whitespace. Default value uses the set of characters defined in [HTML4 standard](https://www.w3.org/TR/html4/struct/text.html#h-9.1). (It includes Zero-width space compared to [living standard](https://infra.spec.whatwg.org#ascii-whitespace).)
`wordwrap`              | `80`         | After how many chars a line break should follow.<br/>Set to `null` or `false` to disable word-wrapping.

#### Options deprecated in version 6

Old&nbsp;option            | Instead&nbsp;use
-------------------------- | -----------
`hideLinkHrefIfSameAsText` | `hideLinkHrefIfSameAsText` option for tags with `anchor` formatter.
`ignoreHref`               | `ignoreHref` option for tags with `anchor` formatter.
`ignoreImage`              | Set format to `skip` for `img` tags.
`linkHrefBaseUrl`          | `baseUrl` option for tags with `anchor` and `image` formatters.
`noAnchorUrl`              | `noAnchorUrl` option for tags with `anchor` formatter.
`noLinkBrackets`           | `noLinkBrackets` option for tags with `anchor` formatter.
`singleNewLineParagraphs`  | Set `leadingLineBreaks` and `trailingLineBreaks` options to `1` for `p` and `pre` tags.
`unorderedListItemPrefix`  | `itemPrefix` option for tags with `unorderedList` formatter.
`uppercaseHeadings`        | `uppercase` option for tags with `heading` formatter, `uppercaseHeaderCells` option for `table` or `dataTable` formatters.

Deprecated options will be removed with future major version update.

#### Options removed in version 6

Old&nbsp;option | Description
--------------- | -----------
`format`        | The way formatters are written has changed completely. New formatters have to be added to the `formatters` option, old ones can not be reused without rewrite. See new instructions below.

#### Tags

By default there are following tag to formatter assignments:

Tag&nbsp;name | Default&nbsp;format | Notes
------------- | ------------------- | -----
`''`          | `inline`            | Catch-all default for unknown tags.
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
`table`       | `table`             | there is also `dataTable` formatter. Using it will be equivalent to setting `tables` to `true`. `tables` option might be deprecated in the future.
`ul`          | `unorderedList`     |
`wbr`         | `wbr`               |

More formatters also available for use:

* `skip` - as the name implies it skips the given tag with it's contents without printing anything.

Format options are specified for each tag indepentently:

Option              | Default     | Applies&nbsp;to    | Description
------------------- | ----------- | ------------------ | -----------
`leadingLineBreaks` | `1`, `2` or `3` | all block-level formatters | Number of line breaks to separate previous block from this one.<br/>Note that N+1 line breaks are needed to make N empty lines.
`trailingLineBreaks` | `1` or `2` | all block-level formatters | Number of line breaks to separate this block from the next one.<br/>Note that N+1 line breaks are needed to make N empty lines.
`baseUrl`           | null        | `anchor`, `image`  | Server host for link `href` attributes and image `src` attributes relative to the root (the ones that start with `/`).<br/>For example, with `baseUrl = 'http://asdf.com'` and `<a href='/dir/subdir'>...</a>` the link in the text will be `http://asdf.com/dir/subdir`.<br/>Keep in mind that `baseUrl` should not end with a `/`.
`hideLinkHrefIfSameAsText` | `false` | `anchor`        | By default links are translated in the following way:<br/>`<a href='link'>text</a>` => becomes => `text [link]`.<br/>If this option is set to `true` and `link` and `text` are the same, `[link]` will be omitted and only `text` will be present.
`ignoreHref`        | `false`     | `anchor`           | Ignore all links. Only process internal text of anchor tags.
`noAnchorUrl`       | `true`      | `anchor`           | Ignore anchor links (where `href='#...'`).
`noLinkBrackets`    | `false`     | `anchor`           | Don't print brackets around links.
`itemPrefix`        | `' * '`     | `unorderedList`    | String prefix for each list item.
`uppercase`         | `true`      | `heading`          | By default, headings (`<h1>`, `<h2>`, etc) are uppercased.<br/>Set this to `false` to leave headings as they are.
`length`            | `undefined` | `horizontalLine`   | Length of the line. If undefined then `wordwrap` value is used. Falls back to 40 if that's also disabled.
`trimEmptyLines`    | `true`      | `blockquote`       | Trim empty lines from blockquote.<br/>While empty lines should be preserved in HTML, space-saving behavior is chosen as default for convenience.
`uppercaseHeaderCells` | `true` | `table`, `dataTable` | By default, heading cells (`<th>`) are uppercased.<br/>Set this to `false` to leave heading cells as they are.
`maxColumnWidth`    | `60`      | `table`, `dataTable` | Data table cell content will be wrapped to fit this width instead of global `wordwrap` limit.<br/>Set to `undefined` in order to fall back to `wordwrap` limit.
`colSpacing`        | `3`       | `table`, `dataTable` | Number of spaces between data table columns.
`rowSpacing`        | `0`       | `table`, `dataTable` | Number of empty lines between data table rows.

How to set a specific format option, example:

```javascript
var { htmlToText } = require('html-to-text');

var text = htmlToText('<a href="/page.html">Page</a>', {
  tags: { 'a': { options: { baseUrl: 'https://example.com' } } }
});

console.log(text); // Page [https://example.com/page.html]
```

### Override formatting

This is significantly changed in version 6.

`formatters` option is an object that holds formatting functions. They can be assigned to format different tags by key in the `tags` option.

Each formatter is a function of four arguments that returns nothing. Arguments are:

* `elem` - the HTML element to be processed by this formatter;
* `walk` - recursive function to process the children of this element. Called as `walk(elem.children, builder)`;
* `builder` - [BlockTextBuilder](https://github.com/html-to-text/node-html-to-text/blob/master/lib/block-text-builder.js) object. Manipulate this object state to build the output text;
* `formatOptions` - options that are specified for a tag, along with this formatter (Note: if you need global html-to-text options - they are accessible via `builder.options`).

Custom formatter example:

```javascript
var { htmlToText } = require('html-to-text');

var text = htmlToText('<foo>Hello World</foo>', {
  formatters: {
    // Create a formatter.
    'fooBlockFormatter': function (elem, walk, builder, formatOptions) {
      builder.openBlock(formatOptions.leadingLineBreaks || 1);
      walk(elem.children, builder);
      builder.addInline('!');
      builder.closeBlock(formatOptions.trailingLineBreaks || 1);
    }
  },
  tags: {
    // Assign it to `foo` tags.
    'foo': {
      format: 'fooBlockFormatter',
      options: { leadingLineBreaks: 1, trailingLineBreaks: 1 }
    }
  }
});

console.log(text); // Hello World!
```

Refer to [built-in formatters](https://github.com/html-to-text/node-html-to-text/blob/master/lib/formatter.js) for more examples.

Refer to [BlockTextBuilder](https://github.com/html-to-text/node-html-to-text/blob/master/lib/block-text-builder.js) for available functions and arguments.

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
