
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const cjs = require('rollup-plugin-cjs-es');


module.exports = {
  input: 'src/html-to-text.js',
  output: [
    { file: 'lib/html-to-text.js', format: 'cjs' }
  ],
  plugins: [
    nodeResolve({ resolveOnly: ['@html-to-text/base'] }),
    cjs({ cache: false })
  ],
};
