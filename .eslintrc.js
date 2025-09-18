module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  env: {
    node: true,
    es6: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.ts' // Skip TypeScript files since we don't have TS ESLint setup
  ]
};
