// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier/flat');

/**
 * Third-party libraries are only reachable through our own wrappers, so upgrading or
 * replacing one touches a single folder:
 * - HTTP goes through HttpBaseService (src/app/core/http)
 * - PrimeNG goes through the components in src/app/shared/ui
 * - ECharts goes through the chart services in src/app/shared/charts
 */
const httpClientImports = {
  name: '@angular/common/http',
  importNames: ['HttpClient', 'httpResource'],
  message:
    'Inject HttpBaseService from src/app/core/http instead of using HttpClient or httpResource directly.',
};
const primeNgImports = {
  group: ['primeng', 'primeng/*', '@primeuix/*'],
  message: 'Use the wrappers from src/app/shared/ui instead of importing PrimeNG directly.',
};
const chartImports = {
  group: ['echarts', 'echarts/*', 'ngx-echarts'],
  message:
    'Use the chart services from src/app/shared/charts instead of importing ECharts directly.',
};

/**
 * ESLint keeps only the last matching config for a rule, so every folder exception
 * restates the restrictions that still apply there.
 */
function restrictImports({ http = true, primeNg = true, charts = true } = {}) {
  return [
    'error',
    {
      paths: http ? [httpClientImports] : [],
      patterns: [...(primeNg ? [primeNgImports] : []), ...(charts ? [chartImports] : [])],
    },
  ];
}

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
          prefix: ['app', 'ui'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['app', 'ui'],
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'no-restricted-imports': restrictImports(),
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Tests may drive HttpClient directly, e.g. against HttpTestingController.
      'no-restricted-imports': restrictImports({ http: false }),
    },
  },
  {
    files: ['src/app/core/http/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports({ http: false }),
    },
  },
  {
    files: ['src/app/shared/ui/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports({ primeNg: false }),
    },
  },
  {
    files: ['src/app/shared/charts/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports({ charts: false }),
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-at-empty': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-any': 'error',
    },
  },
  // Must stay last: turns off every rule that would conflict with Prettier formatting.
  prettier,
]);
