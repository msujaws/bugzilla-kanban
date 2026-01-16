export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.css': ['stylelint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
  // Run changed E2E tests (chromium only for speed, CI runs all browsers)
  'tests/integration/**/*.spec.ts': (files) => `npx playwright test --project=chromium ${files.join(' ')}`,
  // Run tsc on whole project when any source file changes (not per-file)
  'src/**/*.{ts,tsx}': () => 'npx tsc --noEmit',
}
