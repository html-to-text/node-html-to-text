
import test from 'ava';

import { snapshotMacro } from './test-helpers.js';


export default { require: ['./_force-exit.ts'] };

test.serial('version command', snapshotMacro, [
  'version'
]);

test.serial('--version alias', snapshotMacro, [
  '--version'
]);

test.serial('--help alias', snapshotMacro, [
  '--help'
]);
