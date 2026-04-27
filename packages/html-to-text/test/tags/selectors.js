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

test('should support certain pseudo-classes', snapshotMacro, {
  convert: htmlToText,
  input: '<foo>foo1</foo> <foo>foo2</foo> <foo><foo>foo3</foo></foo> <foo><!-- foo4 --></foo> <foo id="foo5"></foo> <foo>foo6</foo> <foo>foo7</foo>',
  options: {
    selectors: [
      { selector: 'foo', format: 'inline' },
      { selector: 'foo:empty', format: 'inlineString', options: { string: 'empty' } },
      { selector: 'foo:first-child', format: 'inlineString', options: { string: 'first-child' } },
      { selector: 'foo:last-child', format: 'inlineString', options: { string: 'last-child' } },
      { selector: 'foo:only-child', format: 'inlineString', options: { string: 'only-child' } },
    ]
  }
});

test('should support the :any-link pseudo-class', snapshotMacro, {
  convert: htmlToText,
  input: '<foo href="#foo">foo</foo> <a href="#a">a1</a> <a>a2</a> <area href="#area" alt="area1"/> <area alt="area2"/>',
  options: {
    selectors: [
      { selector: 'area', format: 'inlineString', options: { string: 'area' } },
      { selector: ':any-link', format: 'inlineString', options: { string: 'any-link' } }
    ]
  }
});
