// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    // shadcn-vue components intentionally omit prop defaults (handled by reka-ui).
    'vue/require-default-prop': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // Clearing reactive error maps with `delete map[key]` is intentional.
    '@typescript-eslint/no-dynamic-delete': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
}).prepend()
