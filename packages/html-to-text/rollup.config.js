
const { nodeResolve } = require('@rollup/plugin-node-resolve');


module.exports = {
  input: 'src/html-to-text.js',
  output: [
    { file: 'lib/html-to-text.mjs', format: 'es' },
    { file: 'lib/html-to-text.cjs', format: 'cjs' },
  ],
  plugins: [
    nodeResolve({ resolveOnly: ['@html-to-text/base'] })
  ],
};
