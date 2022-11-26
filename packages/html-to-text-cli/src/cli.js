import process from 'node:process';

import { htmlToText } from '@html-to-text/html-to-text';
import { handleArgv } from 'aspargvs';
import deepmerge from 'deepmerge';

// import { version } from '../package.json';

const version = '0.5.0';

const kebabToCamelCase = (str) => str
  .replace(/-./g, x => x[1].toUpperCase());

const camelToKebabCase = (str) => str
  .replace(/\B([A-Z])(?=[a-z])/g, '-$1')
  .replace(/\B([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase();

handleArgv({
  handlers: {
    help: true,
    unparse: true,
    inspect: true,
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
      description: 'Some options more suitable for machine search',
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
