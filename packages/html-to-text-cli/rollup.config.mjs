
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

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
    nodeResolve({ resolveOnly: ['html-to-text'] })
  ],
};
