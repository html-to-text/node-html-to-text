import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/html-to-text.ts',
  output: [
    { file: 'lib/html-to-text.mjs', format: 'es' },
    { file: 'lib/html-to-text.cjs', format: 'cjs' },
  ],
  plugins: [
    nodeResolve({ extensions: ['.js', '.ts'], resolveOnly: ['@html-to-text/base'] }),
    typescript({ tsconfig: './tsconfig.rollup.json', include: ['src/**/*.ts', '../base/src/**/*.ts'] }),
  ],
};

