
// const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

/**
 * @type {import('rollup').RollupOptions}
 */
module.exports = {
  input: 'src/cli.js',
  output: [
    {
      // banner: '#!/usr/bin/env node\n',
      file: 'bin/cli.js',
      format: 'es',
    }
  ],
  plugins: [
    // json(),
    nodeResolve({ resolveOnly: ['@html-to-text/html-to-text'] })
  ],
};
