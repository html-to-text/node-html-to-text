
import { nodeResolve } from '@rollup/plugin-node-resolve';


/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/html-to-md.js',
  output: [
    { file: 'lib/html-to-md.mjs', format: 'es' },
    { file: 'lib/html-to-md.cjs', format: 'cjs' }
  ],
  plugins: [
    nodeResolve({ resolveOnly: ['@html-to-text/base'] })
  ],
};
