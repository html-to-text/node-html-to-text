import test from 'ava';

import { convert } from '../../src/html-to-text.js';
import { documentSnapshotMacro } from '../snapshot-helpers.js';


test('should convert invoice fixture document', documentSnapshotMacro, {
  callerFileUrl: import.meta.url,
  convert: convert,
  documentPath: './invoice.html',
  options: {
    selectors: [
      { selector: 'table#invoice', format: 'dataTable' },
      { selector: 'table.address', format: 'dataTable' }
    ]
  }
});
