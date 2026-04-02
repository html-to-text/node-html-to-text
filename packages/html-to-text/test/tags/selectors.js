import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should merge entries with the same selector', snapshotMacro, {
  convert: htmlToText,
  input: '<foo></foo><foo></foo><foo></foo>',
  options: {
    selectors: [
      { selector: 'foo', format: 'somethingElse' },
      { selector: 'foo', options: { length: 20 } },
      { selector: 'foo', options: { leadingLineBreaks: 4 } },
      { selector: 'foo', options: { trailingLineBreaks: 4 } },
      { selector: 'foo', options: { length: 10 } },
      { selector: 'foo', format: 'horizontalLine' }
    ]
  }
});

test('should pick the most specific selector', snapshotMacro, {
  convert: htmlToText,
  input: '<hr/><hr class="foo" id="bar"/>',
  options: {
    selectors: [
      { selector: 'hr', options: { length: 3 } },
      { selector: 'hr#bar', format: 'horizontalLine', options: { length: 5 } },
      { selector: 'hr.foo', format: 'horizontalLine', options: { length: 7 } }
    ]
  }
});

test('should pick the last selector of equal specificity', snapshotMacro, {
  convert: htmlToText,
  input: '<hr class="bar baz"/><hr class="foo bar"/><hr class="foo baz"/>',
  options: {
    selectors: [
      { selector: 'hr.foo', format: 'horizontalLine', options: { length: 7 } },
      { selector: 'hr.baz', format: 'horizontalLine', options: { length: 3 } },
      { selector: 'hr.bar', format: 'horizontalLine', options: { length: 5 } },
      { selector: 'hr.foo' }
    ]
  }
});

test('should allow escape sequences in selectors', snapshotMacro, {
  convert: htmlToText,
  input: '<hr id="sceneI_3.1"/><hr class="---"/>',
  options: {
    selectors: [
      { selector: '#sceneI_3\\.1', format: 'blockString', options: { string: '---[ cut ]---' } },
      { selector: '.\\2d -\\-', format: 'blockString', options: { string: '---[ cut ]---' } }
    ]
  }
});
