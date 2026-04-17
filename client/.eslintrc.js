module.exports = {
  env: { browser: true, node: true },
  parserOptions: { parser: '@typescript-eslint/parser', sourceType: 'module' },
  extends: ['plugin:vue/vue3-essential', 'eslint:recommended'],
  plugins: ['vue', '@typescript-eslint'],
  rules: { 'no-unused-vars': 'off', '@typescript-eslint/no-unused-vars': ['warn'] }
};