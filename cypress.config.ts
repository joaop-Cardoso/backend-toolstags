import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000", // Adiciona a URL base para os testes E2E
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}", // Permite arquivos .ts
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
