import test from 'ava';

import { compile } from '../../src/html-to-text.js';
import { snapshotCompiledMacro } from '../snapshot-helpers.js';


const defaultConvert = compile();

test('should decode &#128514; to 😂', snapshotCompiledMacro, {
  convert: defaultConvert,
  input: '&#128514;'
});

test('should decode &lt;&gt; to <>', snapshotCompiledMacro, {
  convert: defaultConvert,
  input: '<span>span</span>, &lt;not a span&gt;'
});


