
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'ava';

import { snapshotMacro } from './test-helpers.js';


export default { require: ['./_force-exit.ts'] };

const testDir = dirname(fileURLToPath(import.meta.url));
const fixture1 = relative(
  process.cwd(),
  resolve(testDir, './fixtures/options-sample-1.json')
).replace(/\\/g, '/');
const fixture2 = relative(
  process.cwd(),
  resolve(testDir, './fixtures/options-sample-2.json')
).replace(/\\/g, '/');


test.serial('Just cli options', snapshotMacro, [
  'inspect',
  '--wordwrap=42',
  '--longWordSplit.forceWrapOnLimit',
  '--selectors[]',
  '{}',
  ':selector=td',
  ':format=paragraph',
]);

test.serial('Machine preset followed by cli options', snapshotMacro, [
  'inspect',
  'preset',
  'machine',
  '--wordwrap=42',
  '--longWordSplit.forceWrapOnLimit',
  '--selectors[]',
  '{}',
  ':selector=td',
  ':format=paragraph',
]);

test.serial('Json config followed by cli options', snapshotMacro, [
  'inspect',
  'json',
  fixture1,
  '--wordwrap=42',
  '--longWordSplit.forceWrapOnLimit',
  '--selectors[]',
  '{}',
  ':selector=tr',
  ':format=inline',
]);

test.serial('Machine preset followed by json config', snapshotMacro, [
  'inspect',
  'preset',
  'machine',
  'json',
  fixture1,
]);

test.serial('Json config followed by machine preset', snapshotMacro, [
  'inspect',
  'json',
  fixture1,
  'preset',
  'machine',
]);

test.serial('Json config 1 followed by json config 2', snapshotMacro, [
  'inspect',
  'json',
  fixture1,
  'json',
  fixture2,
]);

test.serial('Json config 2 followed by json config 1', snapshotMacro, [
  'inspect',
  'json',
  fixture2,
  'json',
  fixture1,
]);
