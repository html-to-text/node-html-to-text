import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should separate paragraphs from surrounding content by two linebreaks', snapshotMacro, {
  convert: htmlToText,
  input: 'text<p>first</p><p>second</p>text'
});

test('should allow to change the number of linebreaks', snapshotMacro, {
  convert: htmlToText,
  input: 'text<p>first</p><p>second</p>text',
  options: {
    selectors: [
      { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
    ]
  }
});


