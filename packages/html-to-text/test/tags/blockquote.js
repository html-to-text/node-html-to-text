import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { assertSnapshot } from '../snapshot-helpers.js';


test('should handle format single-line blockquote', (t) => {
  const html = 'foo<blockquote>test</blockquote>bar';
  assertSnapshot(t, { convert: htmlToText, input: html, title: 'single-line blockquote' });
});

test('should format multi-line blockquote', (t) => {
  const html = '<blockquote>a<br/>b</blockquote>';
  assertSnapshot(t, { convert: htmlToText, input: html, title: 'multi-line blockquote' });
});

test('should trim newlines unless disabled', (t) => {
  const html = '<blockquote><br/>a<br/><br/><br/></blockquote>';
  const options = {
    selectors: [
      { selector: 'blockquote', options: { trimEmptyLines: false } }
    ]
  };
  assertSnapshot(t, { convert: htmlToText, input: html, title: 'blockquote default trim' });
  assertSnapshot(t, { convert: htmlToText, input: html, options: options, title: 'blockquote trim disabled' });
});


