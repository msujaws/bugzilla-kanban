export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Allow Tailwind @apply
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'variants',
          'responsive',
          'screen',
          'import',
        ],
      },
    ],
    // Allow CSS custom properties
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['/^--/'],
      },
    ],
    // Allow empty sources (for generated files)
    'no-empty-source': null,
  },
}
