import pkg from 'eslint';
const { defineConfig } = pkg;

export default defineConfig({
  files: ["**/*.ts"],
  ignores: [".config/**"],
  rules: {
    // Add custom rules as needed; for now, use defaults
  },
});
