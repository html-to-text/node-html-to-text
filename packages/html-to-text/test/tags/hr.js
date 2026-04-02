import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should output horizontal line of default length', snapshotMacro, {
  convert: htmlToText,
  input: '<div>foo</div><hr/><div>bar</div>'
});

test('should output horizontal line of specific length', snapshotMacro, {
  convert: htmlToText,
  input: '<div>foo</div><hr/><div>bar</div>',
  options: {
    selectors: [
      { selector: 'hr', options: { length: 30 } }
    ]
  }
});

test('should output horizontal line of length 40 when wordwrap is disabled', snapshotMacro, {
  convert: htmlToText,
  input: '<div>foo</div><hr/><div>bar</div>',
  options: { wordwrap: false }
});


