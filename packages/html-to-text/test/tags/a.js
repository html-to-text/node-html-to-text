import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should decode html attribute entities from href', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="/foo?a&#x3D;b">test</a>'
});

test('should not insert null bytes', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="some-url?a=b&amp;b=c">Testing &amp; Done</a>'
});

test('should update relatively sourced links with baseUrl', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="/test.html">test</a>',
  options: {
    selectors: [
      { selector: 'a', options: { baseUrl: 'https://example.com' } }
    ]
  }
});

test('should strip mailto from email links', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="mailto:foo@example.com">email me</a>'
});

test('should return link with brackets by default', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="http://my.link">test</a>'
});

test('should return link without brackets if noLinkBrackets is true (deprecated)', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="http://my.link">test</a>',
  options: {
    selectors: [
      { selector: 'a', options: { noLinkBrackets: true } }
    ]
  }
});

test('should work if deprecated tags option is specified without format', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="http://my.link">test</a>',
  options: { tags: { a: { options: { hideLinkHrefIfSameAsText: true } } } }
});

test('should return link without brackets if linkBrackets is false', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="http://my.link">test</a>',
  options: {
    selectors: [
      { selector: 'a', options: { linkBrackets: false } }
    ]
  }
});

test('should return link without brackets if linkBrackets is ["", ""]', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="http://my.link">test</a>',
  options: {
    selectors: [
      { selector: 'a', options: { linkBrackets: ['', ''] } }
    ]
  }
});

test('should return link with custom brackets', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="http://my.link">test</a>',
  options: {
    selectors: [
      { selector: 'a', options: { linkBrackets: ['===> ', ' <==='] } }
    ]
  }
});

test('should not return link for anchor if noAnchorUrl is true', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="#link">test</a>',
  options: {
    selectors: [
      { selector: 'a', options: { noAnchorUrl: true } }
    ]
  }
});

test('should return link for anchor if noAnchorUrl is false', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="#link">test</a>',
  options: {
    selectors: [
      { selector: 'a', options: { noAnchorUrl: false } }
    ]
  }
});

test('should not uppercase links inside headings', snapshotMacro, {
  convert: htmlToText,
  input: '<h1><a href="http://example.com">Heading</a></h1>'
});

test('should not uppercase links inside table header cells', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
    <table>
      <tr>
        <th>Header cell 1</th>
        <th><a href="http://example.com">Header cell 2</a></th>
        <td><a href="http://example.com">Regular cell</a></td>
      </tr>
    </table>
  `,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable' }
    ]
  }
});

test('should rewrite link href path with provided metadata', snapshotMacro, {
  convert: htmlToText,
  input: '<a href="/test.html">test</a>',
  metadata: { path: '/foo/bar' },
  options: {
    selectors: [
      {
        selector: 'a',
        options: {
          baseUrl: 'https://example.com',
          pathRewrite: (path, meta) => meta.path + path
        }
      }
    ]
  }
});
