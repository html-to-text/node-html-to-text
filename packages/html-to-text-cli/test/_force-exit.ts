import process from 'node:process';
import { registerCompletionHandler } from 'ava';

// https://github.com/avajs/ava/blob/main/docs/08-common-pitfalls.md#timeouts-because-a-file-failed-to-exit

registerCompletionHandler(() => {
  process.exit();
});
