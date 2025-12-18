import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const legacyConfig = require('./.eslintrc.cjs');

const legacyConfigForTs = {
  ...legacyConfig,
  overrides: (legacyConfig.overrides ?? []).map((override) => {
    const files = override.files?.map((pattern) =>
      pattern
        .replace('packages/html-to-text-cli/**/*.js', 'packages/html-to-text-cli/**/*.ts')
        .replace('example/*.js', 'example/*.ts')
        .replace('**/test/*.js', '**/test/*.ts')
    );

    return { ...override, files };
  }),
};

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
  ...compat.config(legacyConfigForTs),
  {
    rules: {
      'filenames/match-exported': 'off',
      'filenames/match-regex': 'off',
      'jsdoc/no-defaults': 'off',
      'jsdoc/reject-any-type': 'off',
      'jsdoc/reject-function-type': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        { 'cjs': 'always', 'js': 'never', 'json': 'always', 'mjs': 'always', 'ts': 'never' },
      ],
      'lines-between-class-members': ['error', 'always', { 'exceptAfterSingleLine': true }],
    },
  },
  {
    files: ['**/types-src/**/*.{ts,mts,cts}'],
    rules: {
      'import/group-exports': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'import/extensions': 'off',
      'import/group-exports': 'off',
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  },
];
