import process from 'node:process';

import { handleArgv } from 'aspargvs';
import deepmerge from 'deepmerge';
import { htmlToText } from 'html-to-text';

import { version } from '../package.json';


const kebabToCamelCase = (str) => str
  .replace(/-./g, x => x[1].toUpperCase());

const camelToKebabCase = (str) => str
  .replace(/\B([A-Z])(?=[a-z])/g, '-$1')
  .replace(/\B([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase();

const helpHeader =
`Advanced html to plain text converter
Version: ${version}

Usage:
  - send input HTML document to stdin;
  - get plain text from stdout;
  - use arguments to specify commands and options;
  - refer to html-to-text package docs for all available options;
  - all options except functions can be expressed in CLI args;
  - below is the short summary of the args syntax;
  - refer to @html-to/text-cli docs for further details.

`;

handleArgv({
  handlers: {
    help: (text) => helpHeader + text,
    unparse: true,
    inspect: { depth: 5, },
    json: businessLogic,
    merge: (acc, next) => deepmerge(acc, next),
    key: kebabToCamelCase,
    unkey: camelToKebabCase,
    bin: () => 'html-to-text',
    version: () => version,
  },
  presets: {
    'human': {
      description: 'Some options more suitable for human reading',
      json: {
        wordwrap: 80,
        longWordSplit: { forceWrapOnLimit: true },
        selectors: [
          { selector: 'table', format: 'dataTable' }
        ]
      }
    },
    'machine': {
      description: 'Some options more suitable for machine processing',
      json: {
        wordwrap: false,
        longWordSplit: { forceWrapOnLimit: false },
        selectors: [
          { selector: 'table', format: 'block' },
          { selector: 'tr', format: 'block' },
          { selector: 'th', format: 'block' },
          { selector: 'td', format: 'block' },
        ]
      }
    }
  }
});

function businessLogic (optionsObject) {
  let text = '';

  process.title = 'html-to-text';

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', data => { text += data; });
  process.stdin.on('end', () => {
    text = htmlToText(text, optionsObject);
    process.stdout.write(text + '\n', 'utf-8');
  });
}
