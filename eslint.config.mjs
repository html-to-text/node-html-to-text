import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import checkFile from "eslint-plugin-check-file";
import { importX } from "eslint-plugin-import-x";
import { jsdoc } from "eslint-plugin-jsdoc";
import globals from "globals";


export default defineConfig([

  globalIgnores([
    "**/*\\{.,-}min.js",
    "**/node_modules",
    "**/coverage",
    "**/lib",
    "**/bin",
    "**/.vscode",
    "**/__*.*"
  ]),

  js.configs.recommended,

  jsdoc({ config: "flat/recommended" }),

  importX.flatConfigs.recommended,

  {
    plugins: {
      "check-file": checkFile,
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {},

      globals: {
        ...globals["shared-node-browser"],
      },
    },

    rules: {
      "block-scoped-var": "error",
      "class-methods-use-this": "error",
      "complexity": ["error", 14],
      "consistent-return": "error",
      "curly": "error",
      "default-case": "error",
      "eqeqeq": ["error"],
      "guard-for-in": "error",
      "max-classes-per-file": ["error", 1],
      "no-alert": "error",
      "no-caller": "error",
      "no-case-declarations": "error",
      "no-div-regex": "error",
      "no-empty-function": "error",
      "no-eq-null": "error",
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-implied-eval": "error",
      "no-invalid-this": "error",
      "no-iterator": "error",
      "no-lone-blocks": "error",
      "no-loop-func": "error",
      "no-multi-spaces": "error",
      "no-multi-str": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-octal-escape": "error",
      "no-proto": "error",
      "no-return-assign": "error",
      "no-script-url": "error",
      "no-self-compare": "error",
      "no-throw-literal": "error",
      "no-unused-expressions": "error",
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-void": "error",
      "no-warning-comments": "warn",
      "radix": "error",
      "wrap-iife": ["error", "any"],
      "no-undef-init": "error",

      "no-unused-vars": ["error", {
        "args": "none", // function shapes have to be clear
      }],

      "block-spacing": "error",

      "brace-style": ["error", "1tbs", {
        "allowSingleLine": true,
      }],

      "camelcase": "error",
      "comma-spacing": "error",
      "comma-style": "error",
      "eol-last": "error",
      "func-call-spacing": "error",

      "func-name-matching": ["error", {
        "includeCommonJSModuleExports": true,
      }],

      "function-call-argument-newline": ["error", "consistent"],
      "function-paren-newline": ["error", "consistent"],

      "indent": ["error", 2, {
        "SwitchCase": 1,
        "flatTernaryExpressions": true,
      }],

      "key-spacing": ["error"],
      "keyword-spacing": "error",
      "lines-between-class-members": "error",
      "max-depth": ["error", 5],
      "max-len": ["error", 130],
      "max-lines-per-function": ["error", 80],
      "max-nested-callbacks": ["error", 4],
      "max-params": ["error", 6],
      "max-statements": ["error", 41],

      "max-statements-per-line": ["error", {
        "max": 2,
      }],

      "multiline-ternary": ["error", "always-multiline"],

      "newline-per-chained-call": ["error", {
        "ignoreChainWithDepth": 3,
      }],

      "no-lonely-if": "warn",
      "no-mixed-operators": "error",
      "no-multiple-empty-lines": "error",
      "no-trailing-spaces": "error",
      "no-whitespace-before-property": "error",

      "object-curly-newline": ["error", {
        "multiline": true,
      }],

      "object-curly-spacing": ["error", "always"],

      "object-property-newline": ["error", {
        "allowAllPropertiesOnSameLine": true,
      }],

      "one-var": ["warn", "never"],
      "quote-props": ["error", "consistent"],

      "quotes": ["error", "single", {
        "avoidEscape": true,
        "allowTemplateLiterals": true,
      }],

      "semi": "error",
      "semi-spacing": "error",
      "semi-style": "error",

      "sort-keys": ["error", "asc", {
        minKeys: 4,
      }],

      "space-before-blocks": "error",
      "space-before-function-paren": ["error"],
      "space-in-parens": "error",
      "space-infix-ops": "error",

      "spaced-comment": ["error", "always", {
        "block": {
          "exceptions": ["html"],
          "balanced": true,
        },
      }],

      "template-tag-spacing": ["error", "never"],
      "arrow-body-style": ["error", "as-needed"],
      "arrow-spacing": "error",
      "no-confusing-arrow": "error",
      "no-var": "error",
      "object-shorthand": ["error", "never"],
      "prefer-const": "error",

      "prefer-destructuring": ["error", {
        AssignmentExpression: {
          array: false,
        },
      }],

      "prefer-rest-params": "error",
      "prefer-spread": "error",

      "jsdoc/check-examples": "off",
      "jsdoc/check-indentation": "error",
      "jsdoc/check-syntax": "error",
      "jsdoc/empty-tags": "error",
      "jsdoc/no-undefined-types": "off", // doesn't work with typedefs in a different file

      "jsdoc/require-description-complete-sentence": ["error", {
        tags: ["typedef"],
      }],

      "jsdoc/require-hyphen-before-param-description": ["error", "never"],

      "jsdoc/require-jsdoc": ["error", {
        "publicOnly": true,
      }],

      "jsdoc/require-returns-description": "off", // description might tell this better, avoid repetition
      "jsdoc/tag-lines": "off",
      "jsdoc/reject-any-type": "off", // to be revisited later
      "jsdoc/reject-function-type": "off", // to be revisited later

      "import-x/no-deprecated": "error",
      "import-x/no-extraneous-dependencies": "off",
      "import-x/no-mutable-exports": "error",
      "import-x/no-amd": "error",
      "import-x/no-nodejs-modules": "error",
      "import-x/first": "error",
      "import-x/no-namespace": "off",
      "import-x/namespace": "error",
      "import-x/extensions": "off",

      "import-x/order": ["error", {
        "newlines-between": "always",

        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true,
        },
      }],

      "import-x/newline-after-import": ["error", {
        "count": 2,
      }],

      "import-x/no-named-default": "error",
      "import-x/no-named-as-default": "error",
      "import-x/group-exports": "error",
      "import-x/no-unresolved": "off",

      "check-file/filename-naming-convention": ["error", {
        "**/*.{js,cjs,mjs,ts,cts,mts}": "KEBAB_CASE",
      }, { "ignoreMiddleExtensions": true }],
    },
  },

  {
    files: ["packages/html-to-text-cli/**/*.js"],

    rules: {
      "sort-keys": "off",

      "import-x/extensions": ["error", "never", {
        "json": "always",
      }],

      "import-x/no-nodejs-modules": ["error", {
        "allow": ["node:process"],
      }],
    },
  },

  {
    files: ["example/*.js"],

    rules: {
      "import-x/no-nodejs-modules": "off",
    },
  },

  {
    files: ["**/test/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "max-len": "off",
      "import-x/no-nodejs-modules": "off",
      "import-x/group-exports": "off",
      "jsdoc/require-jsdoc": "off",
    },
  },

  {
    files: ["eslint.config.mjs"],

    rules: {
      "quotes": ["error", "double"],
      "object-curly-newline": "off",
      "sort-keys": "off",
    },
  }

]);
