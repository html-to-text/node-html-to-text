import test from 'ava';

import { compile } from '../../src/html-to-text.js';


const defaultConvert = compile();

test('should return empty input unchanged', (t) => {
  t.is(defaultConvert(''), '');
});

test('should return empty result if input undefined', (t) => {
  t.is(defaultConvert(), '');
});

test('should return plain text (no line breaks) unchanged', (t) => {
  t.is(defaultConvert('Hello world!'), 'Hello world!');
});


