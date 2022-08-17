
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const cjs = require('rollup-plugin-cjs-es');


module.exports = {
  input: 'src/html-to-md.js',
  output: [
    { file: 'lib/html-to-md.mjs', format: 'es' },
    { file: 'lib/html-to-md.cjs', format: 'cjs' }
  ],
  plugins: [
    nodeResolve({ resolveOnly: ['@html-to-text/base'] }),
    cjs({ cache: false })
  ],
};
