import js from "@eslint/js"

export default [
  {
    ignores: ["src/**", "node_modules/**", ".next/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]
