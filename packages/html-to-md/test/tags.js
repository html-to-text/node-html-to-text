
import test from 'ava';

import { htmlToMarkdown } from '../src/html-to-md';


const snapshotMacro = test.macro({
  exec: function (t, html, options = undefined, metadata = undefined) {
    t.snapshot(htmlToMarkdown(html, options, metadata), '```html\n' + html + '\n```');
  }
});

function tagsSequence (tagNames) {
  return tagNames.map(s => `<${s}>${s}</${s}>`).join(' ');
}

test(
  'common block-level elements',
  snapshotMacro,
  tagsSequence([
    'article', 'aside', 'div', 'figure', 'figcaption',
    'footer', 'form', 'header', 'main', 'nav', 'p', 'section'
  ])
);

test(
  'block with custom spacing',
  snapshotMacro,
  tagsSequence([
    'div', 'div', 'p', 'p', 'div', 'div'
  ]),
  {
    selectors: [
      { selector: 'p', options: { leadingLineBreaks: 4, trailingLineBreaks: 3 } }
    ]
  }
);

test(
  'default formatter is inline',
  snapshotMacro,
  'Lorem <span>ipsum <foo>dolor</foo></span> met'
);

test(
  'headings',
  snapshotMacro,
  tagsSequence([
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'
  ])
);

test(
  'line breaks (HTML tags by default)',
  snapshotMacro,
  `a<br>b<br/><br />c<br><br><br>d`
);

test(
  'line breaks (two spaces)',
  snapshotMacro,
  `a<br>b<br/><br />c<br><br><br>d`,
  {
    selectors: [
      { selector: 'br', options: { string: '  \n' } }
    ]
  }
);

test(
  'line breaks (backslash)',
  snapshotMacro,
  `a<br>b<br/><br />c<br><br><br>d`,
  {
    selectors: [
      { selector: 'br', options: { string: '\\\n' } }
    ]
  }
);

test(
  'horizontal lines (default)',
  snapshotMacro,
  `a<hr>b\n<hr />\nc`
);

test(
  'horizontal lines (custom)',
  snapshotMacro,
  `a<hr>b\n<hr />\nc`,
  {
    selectors: [
      { selector: 'hr', options: { string: '* * *' } }
    ]
  }
);

test(
  'pre',
  snapshotMacro,
  '<P>Code fragment:</P><PRE>  body {\n    color: red;\n  }</PRE>'
);

test(
  'blockquote',
  snapshotMacro,
  'foo<blockquote>quote</blockquote>bar'
);

test(
  'img',
  snapshotMacro,
  '<img src="test.png" alt="alt text" title="title">'
);

test(
  'img with rewritten path',
  snapshotMacro,
  '<img src="pictures/test.png">',
  {
    selectors: [
      {
        selector: 'img',
        options: { pathRewrite: (path, meta) => path.replace('pictures/', meta.assetsPath) }
      }
    ]
  },
  { assetsPath: 'assets/' } // metadata
);

test(
  'img with source encoded as data url',
  snapshotMacro,
  '<img src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==" alt="Red dot" />'
);

test(
  'link',
  snapshotMacro,
  '<a href="/test.html">test</a>'
);

test(
  'email link',
  snapshotMacro,
  '<a href="mailto:foo@example.com">mail me</a>'
);

test(
  'anchor link',
  snapshotMacro,
  '<a href="#anchor">test</a>'
);

test(
  'link with title',
  snapshotMacro,
  '<a href="/test.html" title="Click me">test</a>'
);

test(
  'link with rewritten path and baseUrl',
  snapshotMacro,
  '<a href="/test.html">test</a>',
  {
    selectors: [
      {
        selector: 'a',
        options: {
          baseUrl: 'https://example.com/',
          pathRewrite: (path, meta) => meta.path + path
        }
      }
    ]
  },
  { path: '/foo/bar' } // metadata
);

test(
  'named anchor',
  snapshotMacro,
  '<a name="foo"></a>'
);

test(
  'bold, strong',
  snapshotMacro,
  '<b>bold</b>, <strong>strong</strong>'
);

test(
  'italic, emphasis',
  snapshotMacro,
  '<i>italic</i>, <em>emphasis</em>'
);

test(
  'strikethrough, del',
  snapshotMacro,
  '<s>strikethrough</s>, <del>deleted</del>'
);

test(
  'inline code',
  snapshotMacro,
  'Lorem ipsum <code>code</code> dolor sit'
);

test(
  'sub, sup',
  snapshotMacro,
  'x<sub>2</sub>, x<sup>2</sup>'
);

test(
  'kbd',
  snapshotMacro,
  '<kbd>Ctrl</kbd> + <kbd>C</kbd>'
);

test(
  'figure',
  snapshotMacro,
  /*html*/`
    <figure>
      <img src="/media/image.jpg"
          alt="Alt test">
      <figcaption>Caption</figcaption>
    </figure>`
);

test(
  'picture - ignore sources',
  snapshotMacro,
  /*html*/`
    <picture>
      <source srcset="/media/cc0-images/surfer-240-200.jpg"
              media="(min-width: 800px)">
      <img src="/media/cc0-images/painted-hand-298-332.jpg" alt="Alt text" />
    </picture>`
);

test(
  'definition lists',
  snapshotMacro,
  /*html*/`
    <dl>
      <dt>Title 1</dt>
      <dd>Definition 1</dd>
      <dt>Title 2a</dt>
      <dt>Title 2b</dt>
      <dd>Definition 2a</dd>
      <dd>Definition 2b</dd>
    </dl>`
);

test(
  'definition list with divs',
  snapshotMacro,
  /*html*/`
    <dl>
      <div>
        <dt>Title 1</dt>
        <dd>Definition 1</dd>
      </div>
      <div>
        <dt>Title 2a</dt>
        <dt>Title 2b</dt>
        <dd>Definition 2a</dd>
        <dd>Definition 2b</dd>
      </div>
    </dl>`
);

test(
  'definition lists (compatible syntax)',
  snapshotMacro,
  /*html*/`
    <dl>
      <dt>Title 1</dt>
      <dd>Definition 1</dd>
      <dt>Title 2a</dt>
      <dt>Title 2b</dt>
      <dd>Definition 2a</dd>
      <dd>Definition 2b</dd>
    </dl>`,
  {
    selectors: [
      { selector: 'dl', format: 'definitionListCompatible' }
    ]
  }
);

test(
  'unordered list',
  snapshotMacro,
  /*html*/`
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>`
);

test(
  'ordered list',
  snapshotMacro,
  /*html*/`
    <ol>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ol>`
);

test(
  'ordered list with start number (numbering type is ignored)',
  snapshotMacro,
  /*html*/`
    <ol type="i" start="11">
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ol>`
);

test(
  'ordered list with overridden start number',
  snapshotMacro,
  /*html*/`
    <ol start="11">
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ol>`,
  {
    selectors: [
      { selector: 'ol', options: { start: 22 } }
    ]
  }
);

test(
  'table with header cells in the first row',
  snapshotMacro,
  /*html*/`
    <table>
      <tr><th>a</th><th>b</th><th>c</th></tr>
      <tr><td>d</td><td>e</td><td>f</td></tr>
      <tr><td>g<br>g</td><td>h<br><br>h</td><td>i<br><br><br>i</td></tr>
      <tr><td><p>j</p></td><td><p>k</p><p>k</p></td><td>l</td></tr>
    </table>`
);

test(
  'table with thead, tbody, tfoot',
  snapshotMacro,
  /*html*/`
    <table>
      <thead><tr><td>a</td><td>b</td><td>c</td></tr></thead>
      <tbody><tr><td>d</td><td>e</td><td>f</td></tr></tbody>
      <tfoot><tr><td>g</td><td>h</td><td>i</td></tr></tfoot>
    </table>`
);

test(
  'table without a header',
  snapshotMacro,
  /*html*/`
    <table>
      <tr><td>a</td><td>b</td><td>c</td></tr>
      <tr><td>d</td><td>e</td><td>f</td></tr>
      <tr><td>g</td><td>h</td><td>i</td></tr>
    </table>`
);

const tableWithSpannedCells = /*html*/`
  <table>
    <tr><th colspan="2">a</th><th>c</th></tr>
    <tr><td>d</td><td colspan="2" rowspan="2">e</td></tr>
    <tr><td rowspan="2">g</td></tr>
    <tr><td>k</td><td rowspan="2">l</td></tr>
    <tr><td>m</td></tr>
  </table>`;

test(
  'table with colspans and rowspans (repeat value by default)',
  snapshotMacro,
  tableWithSpannedCells
);

test(
  'table with colspans and rowspans (value in first cell only)',
  snapshotMacro,
  tableWithSpannedCells,
  {
    selectors: [
      { selector: 'table', options: { spanMode: 'first' } }
    ]
  }
);

test(
  'table with colspans and rowspans (value repeated in cells of the first row only)',
  snapshotMacro,
  tableWithSpannedCells,
  {
    selectors: [
      { selector: 'table', options: { spanMode: 'firstRow' } }
    ]
  }
);

test(
  'table with colspans and rowspans (value repeated in cells of the first column only)',
  snapshotMacro,
  tableWithSpannedCells,
  {
    selectors: [
      { selector: 'table', options: { spanMode: 'firstCol' } }
    ]
  }
);

test(
  'table with colspans and rowspans (use HTML tag for spanned cells)',
  snapshotMacro,
  /*html*/`
  <table>
    <tr><td>a</td><td colspan="2">b</td><td rowspan="4">c</td></tr>
    <tr><td>d</td><td colspan="2" rowspan="2">e</td></tr>
    <tr><td>g</td></tr>
    <tr><td>j</td></tr>
  </table>`,
  {
    selectors: [
      { selector: 'table', options: { spanMode: 'tag' } }
    ]
  }
);

test(
  'table with colspans and rowspans (fallback to HTML from "tag" mode)',
  snapshotMacro,
  tableWithSpannedCells,
  {
    selectors: [
      { selector: 'table', options: { spanMode: 'tag' } }
    ]
  }
);
