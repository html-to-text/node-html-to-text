import test from 'ava';

import { compile, convert } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


const defaultConvert = compile();

test('should handle a large number of wbr tags without stack overflow', (t) => {
  let html = '<!DOCTYPE html><html><head></head><body>\n';
  let expected = '';
  for (let i = 0; i < 10000; i++) {
    if (i !== 0 && i % 80 === 0) {
      expected += '\n';
    }
    expected += 'n';
    html += '<wbr>n';
  }
  html += '</body></html>';
  t.is(defaultConvert(html), expected);
});

test('should handle a very large number of wbr tags with limits', (t) => {
  let html = '<!DOCTYPE html><html><head></head><body>';
  for (let i = 0; i < 70000; i++) {
    html += '<wbr>n';
  }
  html += '</body></html>';
  const options = {
    limits: {
      maxChildNodes: 10,
      ellipsis: '(...)'
    }
  };
  t.is(convert(html, options), 'nnnnn(...)');
});

test('should respect maxDepth limit', snapshotMacro, {
  convert: convert,
  input: '<!DOCTYPE html><html><head></head><body><span>a<span>b<span>c<span>d</span>e</span>f</span>g<span>h<span>i<span>j</span>k</span>l</span>m</span></body></html>',
  options: {
    limits: {
      maxDepth: 2,
      ellipsis: '(...)'
    }
  }
});

test('should respect maxChildNodes limit', snapshotMacro, {
  convert: convert,
  input: '<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>',
  options: {
    limits: {
      maxChildNodes: 6,
      ellipsis: '(skipped the rest)'
    },
    selectors: [
      { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
    ]
  }
});

test('should not add ellipsis when maxChildNodes limit is exact match', snapshotMacro, {
  convert: convert,
  input: '<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>',
  options: {
    limits: {
      maxChildNodes: 10,
      ellipsis: 'can\'t see me'
    },
    selectors: [
      { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
    ]
  }
});

test('should use default ellipsis value if none provided', snapshotMacro, {
  convert: convert,
  input: '<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>',
  options: {
    limits: { maxChildNodes: 6 },
    selectors: [
      { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
    ]
  }
});


