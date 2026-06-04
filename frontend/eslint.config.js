import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Layered architecture (frontend-standards §C): app → pages → features → entities → shared.
// No arrow points upward; import/no-restricted-paths rejects placement drift.
const layeredZones = [
  {
    target: './src/shared',
    from: ['./src/entities', './src/features', './src/pages', './src/app'],
  },
  { target: './src/entities', from: ['./src/features', './src/pages', './src/app'] },
  { target: './src/features', from: ['./src/pages', './src/app'] },
  { target: './src/pages', from: ['./src/app'] },
];

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'storybook-static',
      'src/shared/api/schema.gen.ts',
      'public/mockServiceWorker.js',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...jsxA11y.flatConfigs.recommended.rules,
      'import/no-restricted-paths': ['error', { zones: layeredZones }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Tailwind design tokens live in shared/ui/theme; arbitrary values in JSX are forbidden.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/\\[.*\\]/]',
          message: 'Tailwind arbitrary values are forbidden; add a token in shared/ui/theme.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    files: [
      '.storybook/**/*.{ts,tsx}',
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  eslintConfigPrettier,
);
