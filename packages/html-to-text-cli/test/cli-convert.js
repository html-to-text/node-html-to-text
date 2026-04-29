
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'ava';


export default { require: ['./_force-exit.ts'] };

function runCliWithInput (args, input) {
  const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), '../src/cli.js');
  const result = spawnSync(
    process.execPath,
    [cliPath, ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      input: input,
    }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || `CLI exited with code ${result.status}`);
  }

  return result.stdout.replace(/\r\n/g, '\n');
}

test.serial('Basic heading and paragraph', (t) => {
  const input = '<h1>Hello</h1><p>From CLI</p>';
  const output = runCliWithInput(
    [],
    input
  );

  t.snapshot(output, `\`\`\`html\n${input}\n\`\`\``);
});
