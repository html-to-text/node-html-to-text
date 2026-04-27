import test from 'ava';

import {
  composeOptions,
  composeCliOptions,
  mergeDuplicatesPreferLast
} from '../src/options-composer.js';


test('composeOptions should concat root selectors and overwrite baseElements.selectors', (t) => {
  const defaultOptions = {
    baseElements: { selectors: [ 'body' ] },
    formatters: {},
    selectors: [
      { format: 'inline', selector: '*' }
    ]
  };
  const userOptions = {
    baseElements: { selectors: [ 'main' ] },
    selectors: [
      { format: 'block', selector: 'article' }
    ]
  };

  const options = composeOptions({
    defaultOptions: defaultOptions,
    genericFormatters: {},
    packageFormatters: {},
    userOptions: userOptions
  });

  t.deepEqual(options.baseElements.selectors, [ 'main' ]);
  t.deepEqual(
    options.selectors,
    [
      { format: 'inline', selector: '*' },
      { format: 'block', selector: 'article' }
    ]
  );
});

test('composeOptions should overwrite arrays in non-selectors properties', (t) => {
  const defaultOptions = {
    formatters: {},
    longWordSplit: { wrapCharacters: [ '-', '/' ] },
    selectors: []
  };
  const userOptions = { longWordSplit: { wrapCharacters: [ '.' ] } };

  const options = composeOptions({
    defaultOptions: defaultOptions,
    genericFormatters: {},
    packageFormatters: {},
    userOptions: userOptions
  });

  t.deepEqual(options.longWordSplit.wrapCharacters, [ '.' ]);
});

test('composeOptions should preserve formatter precedence', (t) => {
  const genericFormatter = () => 'generic';
  const packageFormatter = () => 'package';
  const userFormatter = () => 'user';

  const defaultOptions = {
    formatters: {},
    selectors: []
  };
  const userOptions = {
    formatters: {
      'customUser': userFormatter,
      'shared': userFormatter
    }
  };
  const genericFormatters = {
    'genericOnly': genericFormatter,
    'shared': genericFormatter
  };
  const packageFormatters = {
    'packageOnly': packageFormatter,
    'shared': packageFormatter
  };

  const options = composeOptions({
    defaultOptions: defaultOptions,
    genericFormatters: genericFormatters,
    packageFormatters: packageFormatters,
    userOptions: userOptions
  });

  t.is(options.formatters.genericOnly, genericFormatter);
  t.is(options.formatters.packageOnly, packageFormatter);
  t.is(options.formatters.customUser, userFormatter);
  t.is(options.formatters.shared, userFormatter);
});

test('composeOptions should deduplicate selectors preferring last item values', (t) => {
  const defaultOptions = {
    formatters: {},
    selectors: [
      {
        format: 'anchor',
        options: {
          linkBrackets: [ '[', ']' ],
          nested: {
            one: true,
            two: true
          }
        },
        selector: 'a'
      }
    ]
  };
  const userOptions = {
    selectors: [
      {
        options: { nested: { two: false } },
        selector: 'a'
      }
    ]
  };

  const options = composeOptions({
    defaultOptions: defaultOptions,
    genericFormatters: {},
    packageFormatters: {},
    userOptions: userOptions
  });

  t.deepEqual(
    options.selectors,
    [
      {
        format: 'anchor',
        options: {
          linkBrackets: [ '[', ']' ],
          nested: {
            one: true,
            two: false
          }
        },
        selector: 'a'
      }
    ]
  );
});

test('composeOptions should run handleMergedOptions hook after preprocessing', (t) => {
  let hookCalled = false;

  const defaultOptions = {
    formatters: {},
    selectors: [
      { format: 'inline', selector: '*' }
    ]
  };
  const userOptions = {
    selectors: [
      { format: 'block', selector: 'article' }
    ]
  };

  const options = composeOptions({
    defaultOptions: defaultOptions,
    genericFormatters: {},
    handleMergedOptions: function (merged) {
      hookCalled = true;
      merged.extra = true;
      merged.selectors.push({ format: 'inline', selector: 'custom' });
    },
    packageFormatters: {},
    userOptions: userOptions
  });

  t.true(hookCalled);
  t.true(options.extra);
  t.deepEqual(
    options.selectors,
    [
      { format: 'inline', selector: '*' },
      { format: 'block', selector: 'article' },
      { format: 'inline', selector: 'custom' }
    ]
  );
});

test('composeCliOptions should concat root selectors and overwrite baseElements.selectors', (t) => {
  const a = {
    baseElements: { selectors: [ 'foo', 'bar' ] },
    selectors: [
      { format: 'inline', selector: 'foo' },
      { format: 'block', selector: 'bar' }
    ]
  };
  const b = {
    baseElements: { selectors: [ 'foo', 'baz' ] },
    selectors: [
      { format: 'skip', selector: 'foo' },
      { format: 'paragraph', selector: 'baz' }
    ]
  };
  const c = {
    baseElements: { selectors: [ 'bar', 'baz' ] },
    selectors: [
      { format: 'anchor', selector: 'bar' },
      { format: 'heading', selector: 'baz' }
    ]
  };

  const merged = composeCliOptions(composeCliOptions(a, b), c);

  t.deepEqual(merged.baseElements.selectors, [ 'bar', 'baz' ]);
  t.deepEqual(
    merged.selectors,
    [
      { format: 'skip', selector: 'foo' },
      { format: 'anchor', selector: 'bar' },
      { format: 'heading', selector: 'baz' }
    ]
  );
});

test('composeCliOptions should overwrite arrays in non-selectors properties', (t) => {
  const a = { longWordSplit: { wrapCharacters: [ '-', '/' ] } };
  const b = { longWordSplit: { wrapCharacters: [ '.', ',' ] } };
  const c = { longWordSplit: { wrapCharacters: [ '+', '=' ] } };

  const merged = composeCliOptions(composeCliOptions(a, b), c);

  t.deepEqual(merged.longWordSplit.wrapCharacters, [ '+', '=' ]);
});

test('composeCliOptions should remove formatters', (t) => {
  const a = { formatters: '' };
  const b = { formatters: '() => "b"' };

  const merged = composeCliOptions(a, b);

  t.false('formatters' in merged);
});

test('composeCliOptions should deduplicate selectors preferring last item values', (t) => {
  const a = {
    selectors: [
      {
        format: 'anchor',
        options: {
          linkBrackets: [ '[', ']' ],
          nested: {
            one: true,
            two: true
          }
        },
        selector: 'a'
      }
    ]
  };
  const b = {
    selectors: [
      {
        options: { nested: { two: false } },
        selector: 'a'
      }
    ]
  };
  const c = {
    selectors: [
      {
        options: { nested: { three: true } },
        selector: 'a'
      }
    ]
  };

  const merged = composeCliOptions(composeCliOptions(a, b), c);

  t.deepEqual(
    merged.selectors,
    [
      {
        format: 'anchor',
        options: {
          linkBrackets: [ '[', ']' ],
          nested: {
            one: true,
            two: false,
            three: true
          }
        },
        selector: 'a'
      }
    ]
  );
});

test('mergeDuplicatesPreferLast should merge duplicate records and preserve order by last occurrence', (t) => {
  const items = [
    {
      options: {
        nested: {
          one: true,
          two: true
        }
      },
      selector: 'a'
    },
    {
      options: { alpha: true },
      selector: 'b'
    },
    {
      options: { nested: { two: false } },
      selector: 'a'
    }
  ];

  const deduplicated = mergeDuplicatesPreferLast(items, (item) => item.selector);

  t.deepEqual(
    deduplicated,
    [
      {
        options: { alpha: true },
        selector: 'b'
      },
      {
        options: {
          nested: {
            one: true,
            two: false
          }
        },
        selector: 'a'
      }
    ]
  );
});
