// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/**
 * Third-party UI and chart libraries are only reachable through our own wrappers,
 * so upgrading or replacing a library touches a single folder.
 */
const primeNgImports = {
  group: ['primeng', 'primeng/*', '@primeuix/*'],
  message: 'Use the wrappers from src/app/shared/ui instead of importing PrimeNG directly.',
};
const chartImports = {
  group: ['echarts', 'echarts/*', 'ngx-echarts'],
  message: 'Use the chart services from src/app/shared/charts instead of importing ECharts directly.',
};

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      'no-restricted-imports': ['error', { patterns: [primeNgImports, chartImports] }],
    },
  },
  {
    files: ['src/app/shared/ui/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [chartImports] }],
    },
  },
  {
    files: ['src/app/shared/charts/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [primeNgImports] }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
