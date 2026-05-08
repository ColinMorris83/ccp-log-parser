import eslint from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import vitestPlugin from '@vitest/eslint-plugin';
import prettierConfig from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import { configs as regexpConfigs } from 'eslint-plugin-regexp';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ────────────────────────────────────────────────────────────────────
// File patterns
// ────────────────────────────────────────────────────────────────────

const TS_FILES = ['**/*.ts', '**/*.tsx'];
const JS_FILES = ['**/*.js', '**/*.cjs', '**/*.mjs'];
const TEST_FILES = ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'];

// ────────────────────────────────────────────────────────────────────
// React config
// ────────────────────────────────────────────────────────────────────

const reactRecommended = eslintReact.configs['recommended-typescript'];

// ────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────

export default defineConfig([
  // ── Linter options ──────────────────────────────────────────────
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
    name: 'linter-options',
  },

  // ── Ignores ─────────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**'],
    name: 'global-ignores',
  },

  // ── ESLint recommended ──────────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript (strict + stylistic, type-checked) ───────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: TS_FILES,
    languageOptions: { parserOptions: { projectService: true } },
    name: 'typescript-project-service',
  },
  {
    files: TS_FILES,
    languageOptions: { globals: { ...globals.node } },
    name: 'typescript-overrides',
    plugins: { 'import-x': importX },
    rules: {
      ...importX.flatConfigs.recommended.rules,
      ...importX.flatConfigs.typescript.rules,
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-meaningless-void-operator': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignoreConditionalTests: true,
          ignoreMixedLogicalExpressions: true,
          ignorePrimitives: { string: true },
        },
      ],
      '@typescript-eslint/prefer-reduce-type-parameter': 'off',
      '@typescript-eslint/require-array-sort-compare': ['error', { ignoreStringArrays: false }],
      'import-x/default': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/order': 'off',
    },
    settings: { 'import-x/resolver-next': [createTypeScriptImportResolver()] },
  },

  // ── JavaScript ──────────────────────────────────────────────────
  {
    files: JS_FILES,
    languageOptions: { globals: { ...globals.node } },
    name: 'javascript-config',
    plugins: { 'import-x': importX },
    rules: {
      ...importX.flatConfigs.recommended.rules,
      'import-x/default': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/order': 'off',
    },
  },

  // ── Common JS + TS rules ────────────────────────────────────────
  {
    files: [...TS_FILES, ...JS_FILES],
    name: 'common-overrides',
    rules: {
      'no-console': ['warn'],
      'no-negated-condition': 'error',
      'no-useless-return': 'error',
      'sort-imports': 'off',
      'sort-keys': 'off',
    },
  },

  // ── JSDoc ───────────────────────────────────────────────────────
  {
    ...jsdoc.configs['flat/recommended-typescript-error'],
    files: [...TS_FILES, ...JS_FILES],
    name: 'jsdoc-recommended',
  },
  {
    files: [...TS_FILES, ...JS_FILES],
    name: 'jsdoc-overrides',
    rules: {
      'jsdoc/check-indentation': ['error'],
      'jsdoc/no-blank-blocks': 'error',
      'jsdoc/no-types': ['error'],
      'jsdoc/require-description': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: [
            'ExportNamedDeclaration > TSInterfaceDeclaration',
            'ExportDefaultDeclaration > TSInterfaceDeclaration',
            'ExportNamedDeclaration > TSTypeAliasDeclaration',
            'ExportDefaultDeclaration > TSTypeAliasDeclaration',
            'ExportNamedDeclaration > TSEnumDeclaration',
            'ExportDefaultDeclaration > TSEnumDeclaration',
            'ExportNamedDeclaration > FunctionDeclaration',
            'ExportDefaultDeclaration > FunctionDeclaration',
            'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator',
            'ExportDefaultDeclaration > VariableDeclaration > VariableDeclarator',
            'ExportDefaultDeclaration > ArrowFunctionExpression',
            'ExportNamedDeclaration > ClassDeclaration',
            'ExportDefaultDeclaration > ClassDeclaration',
          ],
          publicOnly: true,
        },
      ],
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
    },
  },

  // ── Regexp ──────────────────────────────────────────────────────
  {
    ...regexpConfigs.recommended,
    files: [...TS_FILES, ...JS_FILES],
    name: 'regexp-recommended',
  },

  // ── Unicorn ─────────────────────────────────────────────────────
  {
    files: [...TS_FILES, ...JS_FILES],
    name: 'unicorn-overrides',
    plugins: { unicorn },
    rules: {
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-instanceof-builtins': 'error',
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/no-useless-promise-resolve-reject': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-math-min-max': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-single-call': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/require-array-join-separator': 'error',
      'unicorn/throw-new-error': 'error',
    },
  },

  // ── Perfectionist ───────────────────────────────────────────────
  {
    ...perfectionist.configs['recommended-natural'],
    name: 'perfectionist-recommended-natural',
  },
  {
    name: 'perfectionist-overrides',
    rules: {
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-modules': 'off',
      'perfectionist/sort-named-imports': 'off',
    },
  },

  // ── React ───────────────────────────────────────────────────────
  {
    ...reactRefresh.configs.vite(),
    files: TS_FILES,
    name: 'react-refresh-vite',
  },
  {
    files: TS_FILES,
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    name: 'react-recommended',
    plugins: reactRecommended.plugins,
    rules: reactRecommended.rules,
    settings: reactRecommended.settings,
  },
  {
    files: TS_FILES,
    name: 'react-overrides',
    rules: {
      '@eslint-react/jsx-no-children-prop': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
    },
  },

  // ── Vitest ──────────────────────────────────────────────────────
  {
    files: TEST_FILES,
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitestPlugin.environments.env.globals,
      },
    },
    name: 'vitest-recommended',
    plugins: { vitest: vitestPlugin },
    rules: { ...vitestPlugin.configs.recommended.rules },
    settings: { vitest: { typecheck: true } },
  },
  {
    files: TEST_FILES,
    name: 'test-overrides',
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'no-console': 'off',
      'unicorn/no-useless-undefined': 'off',
    },
  },

  // ── Prettier (must be last) ─────────────────────────────────────
  prettierConfig,
]);
