
import test from 'ava';

import { snapshotMacro } from './test-helpers.js';


test.serial('version command', snapshotMacro, [
  'version'
]);

test.serial('--version alias', snapshotMacro, [
  '--version'
]);

test.serial('--help alias', snapshotMacro, [
  '--help'
]);
