import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
      'src/shared/api/schema.gen.ts',
      'coverage',
      'eslint.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'import/no-restricted-paths': ['error', { zones: layeredZones }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);
