import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

const nodeGlobals = {
  Buffer: 'readonly',
  clearImmediate: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  global: 'readonly',
  process: 'readonly',
  setImmediate: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
};

const mochaGlobals = {
  after: 'readonly',
  afterEach: 'readonly',
  before: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  it: 'readonly',
};

const tsFiles = ['**/*.{ts,mts,cts}'];
const jsFiles = ['**/*.{js,mjs,cjs}'];

export default [
  {
    ignores: [
      'eslint.config.js',
      '**/*{.,-}min.js',
      '**/node_modules/**',
      '**/coverage/**',
      '**/lib/**',
      '**/bin/**',
      '**/types/**',
      '.vscode/**',
      '**/__*.*',
    ],
  },
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: nodeGlobals,
    },
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],

      'import/no-unresolved': 'off',
      'import/no-nodejs-modules': 'off',
      'import/order': [
        'error',
        { 'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: true } }
      ],
      'import/newline-after-import': ['error', { 'count': 2 }],
      'import/extensions': [
        'error',
        'ignorePackages',
        { 'cjs': 'always', 'js': 'never', 'json': 'always', 'mjs': 'always', 'ts': 'never' },
      ],
    },
  },
  {
    files: ['**/test/**/*.{js,ts,mjs,cjs,mts,cts}'],
    languageOptions: { globals: mochaGlobals },
  },
  {
    files: tsFiles,
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      'no-unused-vars': 'off',
      'import/extensions': 'off',
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  },
  {
    files: jsFiles,
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
];
