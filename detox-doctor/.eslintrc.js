module.exports = {
  env: {
    node: true,
    jest: true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:unicorn/all",
    "plugin:jsdoc/recommended",
    "plugin:node/recommended",
    "plugin:prettier/recommended"
  ],
  ignorePatterns: [
    "__fixtures__",
    "*.js",
    "coverage",
    "dist",
    "scripts",
    "website",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json"
  },
  plugins: [
    "no-only-tests"
  ],
  rules: {
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never"
      }
    ],
    "import/no-cycle": "error",
    "import/order": ["error", {
      alphabetize: {order: "asc", caseInsensitive: true}
    }],
    "import/no-internal-modules": "error",
    "no-process-exit": "off",
    "node/no-missing-import": "off",
    "node/no-unsupported-features/es-syntax": "off",
    "@typescript-eslint/member-ordering": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_",
    }],
    "unicorn/filename-case": "off",
    "unicorn/prefer-at": "off",
    "unicorn/prefer-json-parse-buffer": "off",
    "unicorn/prefer-node-protocol": "off",
    "unicorn/prefer-string-replace-all": "off",
    "unicorn/prevent-abbreviations": "off",
    "unicorn/no-array-reduce": "off",
    "unicorn/no-null": "off",
    "unicorn/no-keyword-prefix": "off",
    "unicorn/no-unused-properties": "off",
    "unicorn/prefer-module": "off",
    "jsdoc/require-jsdoc": "off"
  },
  overrides: [
    {
      files: ["**/__tests__/*.ts", "**/__utils__/**/*.ts", "*.test.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "node/no-unpublished-import": "off",
        "import/no-internal-modules": "off",
        "no-only-tests/no-only-tests": "error"
      }
    },
    {
      files: ["src/rules/**/*.ts"],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/explicit-function-return-type": ["error", {
          "allowedNames": ["_doFix", "_doCheck"],
          "allowHigherOrderFunctions": true,
          "allowExpressions": true,
        }],
      }
    }
  ]
};
