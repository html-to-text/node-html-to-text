import { existsSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import test from 'ava';
import { stdout } from 'test-console';


function normalizeOutput (lines) {
  return lines.join('').replace(/\r\n/g, '\n');
}

function sanitizePathToken (token) {
  if (!isAbsolute(token)) {
    return token;
  }
  if (!existsSync(token)) {
    return token;
  }
  return `"${relative(process.cwd(), token).replace(/\\/g, '/')}"`;
}

async function runCli (args) {
  const originalArgv = process.argv;
  const inspect = stdout.inspect();

  try {
    process.argv = ['node', 'html-to-text', ...args];

    const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), '../src/cli.js');
    const cliUrl = new URL(pathToFileURL(cliPath));
    cliUrl.searchParams.set('testCase', `${Date.now()}-${Math.random()}`);

    await import(cliUrl.href);

    return normalizeOutput(inspect.output);
  } finally {
    inspect.restore();
    process.argv = originalArgv;
  }
}

const snapshotMacro = test.macro({
  exec: async (t, args) => {
    const output = await runCli(args);
    const sanitizedArgs = args.map(sanitizePathToken);
    t.snapshot(
      output,
      `\`\`\`\nhtml-to-text ${sanitizedArgs.join(' ')}\n\`\`\``,
    );
  }
});

export { runCli, snapshotMacro };
