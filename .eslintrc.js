module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    es2020: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/'
  ],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'standard-with-typescript'
      ],
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        'semi': ['error', 'never']
      }
    },
    {
      files: ['bin/create-c1-app'],
      extends: [
        'eslint:recommended'
      ],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      rules: {
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'off',
        'prefer-const': 'error',
        'no-var': 'error',
        'semi': ['error', 'never']
      }
    }
  ]
};
