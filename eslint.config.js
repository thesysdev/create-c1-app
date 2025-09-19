const tseslint = require('@typescript-eslint/eslint-plugin')
const tsparser = require('@typescript-eslint/parser')

module.exports = [
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/']
  },

  // Base configuration for JavaScript/Node files
  {
    files: ['bin/create-c1-app'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'semi': ['error', 'never']
    }
  },

  // TypeScript configuration
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        NodeJS: 'readonly',
        fetch: 'readonly' // Add fetch global
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // Basic ESLint rules - only important ones
      'no-unused-vars': 'off', // Turn off base rule
      'no-undef': 'off', // TypeScript handles this
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Disable style rules - focus on functionality
      'semi': 'off',
      'quotes': 'off',
      'comma-dangle': 'off',
      'space-before-function-paren': 'off',
      'indent': 'off',
      
      // TypeScript specific rules - only important ones
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn'
    }
  }
]
