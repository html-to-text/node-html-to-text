import test from 'ava';

import { compile, convert } from '../../src/html-to-text.js';


const defaultConvert = compile();

test('should not be ignored inside a whitespace-only node', (t) => {
  const html = 'foo<span> </span>bar';
  const expected = 'foo bar';
  t.is(defaultConvert(html), expected);
});

test('should handle html character entities for html whitespace characters', (t) => {
  const html = /*html*/`a<span>&#x0020;</span>b<span>&Tab;</span>c<span>&NewLine;</span>d<span>&#10;</span>e`;
  const expected = 'a b c d e';
  t.is(defaultConvert(html), expected);
});

test('should not add additional whitespace after sup', (t) => {
  const html = '<p>This text contains <sup>superscript</sup> text.</p>';
  const options = { preserveNewlines: true };
  const expected = 'This text contains superscript text.';
  t.is(convert(html, options), expected);
});

test('should handle custom whitespace characters', (t) => {
  // No-Break Space - decimal 160, hex \u00a0.
  const html = /*html*/`<span>first span\u00a0</span>&nbsp;<span>&#160;last span</span>`;
  const expectedDefault = 'first span\u00a0\u00a0\u00a0last span';
  t.is(defaultConvert(html), expectedDefault);

  const options = { whitespaceCharacters: ' \t\r\n\f\u200b\u00a0' };
  const expectedCustom = 'first span last span';
  t.is(convert(html, options), expectedCustom);
});

test('should handle space and newline combination', (t) => {
  const html = '<span>foo</span> \n<span>bar</span>\n <span>baz</span>';
  const expectedDefault = 'foo bar baz';
  t.is(defaultConvert(html), expectedDefault);

  const expectedCustom = 'foo\nbar\nbaz';
  t.is(convert(html, { preserveNewlines: true }), expectedCustom);
});

test('should not have extra spaces at beginning for space-indented html', (t) => {
  const html = /*html*/`<html>
<body>
    <p>foo</p>
    <p>bar</p>
</body>
</html>`;
  const expected = 'foo\n\nbar';
  t.is(defaultConvert(html), expected);
});


