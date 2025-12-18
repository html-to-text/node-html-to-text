import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/cli.ts',
  output: [
    {
      banner: '#!/usr/bin/env node\n',
      file: 'bin/cli.js',
      format: 'es',
    },
  ],
  plugins: [
    json(),
    nodeResolve({ extensions: ['.js', '.ts'], resolveOnly: ['html-to-text'] }),
    typescript({
      tsconfig: './tsconfig.rollup.json',
      include: ['src/**/*.ts', '../html-to-text/src/**/*.ts', '../base/src/**/*.ts'],
    }),
  ],
};

