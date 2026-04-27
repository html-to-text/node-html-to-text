
import { createRequire } from 'node:module';

import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';


const require = createRequire(import.meta.url);
const { version: httVersion } = require('../html-to-text/package.json');
const { version: cliVersion } = require('./package.json');

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/cli.js',
  output: [
    {
      banner: '#!/usr/bin/env node\n',
      file: 'bin/cli.js',
      format: 'es',
    }
  ],
  plugins: [
    json(),
    nodeResolve({ resolveOnly: ['html-to-text', '@html-to-text/base'] }),
    replace({
      '__CLI_VERSION__': JSON.stringify(cliVersion),
      '__HTT_VERSION__': JSON.stringify(httVersion),
      preventAssignment: true,
    })
  ],
};
