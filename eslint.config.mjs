/** @type {import('eslint').Linter.Config} */
export default {
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