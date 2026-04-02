import test from 'ava';

import { compile, convert } from '../../src/html-to-text.js';
import { assertSnapshot, snapshotCompiledMacro, snapshotMacro } from '../snapshot-helpers.js';


const defaultConvert = compile();
const longStr = '111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888 999999999';

test('should wordwrap at 80 characters by default', snapshotCompiledMacro, {
  convert: defaultConvert,
  input: longStr
});


test('should wordwrap at given number of characters', (t) => {
  assertSnapshot(t, {
    convert: convert,
    input: longStr,
    options: { wordwrap: 20 },
    title: 'wordwrap at 20 characters',
  });
  assertSnapshot(t, {
    convert: convert,
    input: longStr,
    options: { wordwrap: 50 },
    title: 'wordwrap at 50 characters',
  });
  assertSnapshot(t, {
    convert: convert,
    input: longStr,
    options: { wordwrap: 70 },
    title: 'wordwrap at 70 characters',
  });
});

test('should not wordwrap when given null', snapshotMacro, {
  convert: convert,
  input: longStr,
  options: { wordwrap: null }
});

test('should not wordwrap when given false', snapshotMacro, {
  convert: convert,
  input: longStr,
  options: { wordwrap: false }
});

test('should not exceed the line width when processing embedded format tags', snapshotMacro, {
  convert: convert,
  input: '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.</p>',
  options: {}
});

test('should work with a long string containing line feeds', snapshotMacro, {
  convert: convert,
  input: '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>',
  options: {}
});

test('should not wrongly truncate lines when processing embedded format tags', snapshotMacro, {
  convert: convert,
  input: '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.  However it can affect where the next line breaks and this could lead to having an early line break</p>',
  options: {}
});

test('should not exceed the line width when processing anchor tags', snapshotMacro, {
  convert: convert,
  input: '<p>We appreciate your business. And we hope you\'ll check out our <a href="http://example.com/">new products</a>!</p>',
  options: {}
});

test('should honour line feeds from a long word across the wrap, where the line feed is before the wrap', snapshotMacro, {
  convert: convert,
  input: '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>',
  options: {}
});

test('should remove line feeds from a long word across the wrap, where the line feed is after the wrap', snapshotMacro, {
  convert: convert,
  input: '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>',
  options: {}
});
