import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import importX from 'eslint-plugin-import-x';
import localRules from './eslint-rules.mjs';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '.yarn/**',
      '**/*.d.ts',
      '**/*.d.ts.map',
      // Stray tsc output next to sources (see .gitignore).
      'packages/*/src/**/*.js',
      'packages/*/src/**/*.js.map',
      'detox/src/**/*.js.map',
      // The Detox 20 workspaces keep their own lint setup (detox/test runs
      // `eslint .` with its own config); this config covers the v21 sources
      // and the root tooling only.
      'detox/android/**',
      'detox/detox-native/**',
      'detox/ios/**',
      'detox/local-cli/**',
      'detox/runners/**',
      'detox/scripts/**',
      'detox/test/**',
      'detox/*.js',
      // Detox 20's rn-consts, kept verbatim for the e2e suite.
      'detox/src/utils/**',
      'detox-cli/**',
      'examples/**',
      'website/**',
      'generation/**',
      'docs/**',
      'scripts/*.sh',
      'scripts/ci.*.js',
      'scripts/change_react_native_version.js',
      'scripts/create_redirect_html.js',
      'scripts/purge_expired_domains.mjs',
      'scripts/utils/**',
      '.remarkrc.mjs',
      '.remarkrc.nightly.mjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.mjs',
            '*.js',
            'scripts/*.js',
            'scripts/*.mjs',
            'scripts/lib/*.js',
            // Spec-009's probe runner: a plain-node script the accept
            // fixtures configure as their test runner ($0), editable like
            // every specs/helpers file.
            'specs/helpers/*.cjs',
            'vitest.config.ts',
          ],
          // Small repo: the tooling/config scripts legitimately use the
          // inferred default project. Raise the default 8-file ceiling so
          // adding the accept runner does not trip it.
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 30,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Specs are linted for floating promises — a floating `DetoxOperation` is
    // the bug we most want caught there. node:test's `test()` is the one call
    // that is safe to leave unawaited.
    files: ['specs/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': [
        'error',
        { allowForKnownSafeCalls: [{ from: 'package', name: 'test', package: 'node:test' }] },
      ],
    },
  },
  {
    // TS already reports unresolved identifiers via the type checker; core
    // no-undef produces false positives on TS-only globals/ambient types.
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    // Plain CJS Node entry points (build/tooling scripts), not part of
    // the TS package sources — require() is the correct form here.
    files: [
      'esbuild.config.js',
      'commitlint.config.js',
      'scripts/**/*.js',
      'specs/helpers/*.cjs',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Test doubles are routinely `async` purely to satisfy a Promise-typed
    // handler contract, with nothing to actually await inside. TS already
    // enforces the return type; this rule adds no real safety here.
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    plugins: {
      local: localRules,
      'import-x': importX,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'local/no-anonymous-object-type': 'error',
      'local/param-count': ['error', { constructor: 2, method: 3 }],

      // Cheap baseline hygiene not covered by eslint:recommended.
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',

      // Package-boundary hygiene — currently zero violations, pure prevention.
      'import-x/no-cycle': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@detox-remote/*/*'],
              message:
                'Deep import into a workspace package is not allowed — import from the package barrel (@detox-remote/core, @detox-remote/protocol) instead.',
            },
          ],
        },
      ],

      // The no-unsafe-* family (from recommendedTypeChecked) flags real `any`
      // usage in a few spots (SimulatorOps.ts among them). Eliminating `any`
      // there is a separate cleanup — kept visible but non-blocking until then.
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },
);
