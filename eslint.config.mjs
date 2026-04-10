import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow unused variables and parameters (will be cleaned up later)
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Allow any type for now (will be typed properly later)
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "warn",
      
      // Allow require imports for now
      "@typescript-eslint/no-require-imports": "warn",
      
      // React hooks dependency warnings
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
