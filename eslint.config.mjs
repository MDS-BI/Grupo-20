/** @type {import('eslint').Linter.Config} */
export default {
  ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      console: 'readonly',
    },
  },
  plugins: {},
  rules: {
    'no-console': 'off',
    'no-alert': 'off',
    'eqeqeq': 'error',
    'strict': 'warn',
    'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
  },
};