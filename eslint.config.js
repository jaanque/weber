import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
    plugins: {
      react: pluginReact, // Registrar el plugin de React
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules, // Usar las reglas del plugin registrado
      ...pluginReactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
      "react/prop-types": "off", // Desactivado porque no usamos PropTypes
      "react/react-in-jsx-scope": "off", // Desactivado para Vite/React 17+
    },
  },
  {
    ignores: ["dist", "node_modules", ".gitignore", "eslint.config.js"],
  }
];