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
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Le français utilise beaucoup d'apostrophes dans le texte JSX :
      // on autorise `'` (déjà valide en JSX) tout en gardant les autres entités.
      "react/no-unescaped-entities": ["error", { forbid: [">", '"', "}"] }],
    },
  },
];

export default eslintConfig;
