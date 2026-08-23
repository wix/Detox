import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import tseslint from 'typescript-eslint';
import rules from './eslint-rules.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    sourceType: 'module',
  },
});

describe('eslint-rules', () => {
  it('no-anonymous-object-type', () => {
    ruleTester.run('no-anonymous-object-type', rules.rules['no-anonymous-object-type'], {
      valid: [
        'type Foo = { id: string };',
        'interface Foo { id: string }',
        'interface Foo { bar: { baz: string } }',
        'type Foo = { bar: { baz: string } };',
        'const x: Foo = { id: "1" };',
        'class C { prop: { id: string } = { id: "1" }; }',
        'function f(x: Foo): Foo { return x; }',
        'const x = y as Foo;',
      ],
      invalid: [
        {
          code: 'const x = y as { id: string };',
          errors: [{ messageId: 'anonymousType' }],
        },
        {
          code: 'const x = <{ id: string }>y;',
          errors: [{ messageId: 'anonymousType' }],
        },
        {
          code: 'function f(x: { id: string }) {}',
          errors: [{ messageId: 'anonymousType' }],
        },
        {
          code: 'const f = (x: { id: string }) => {};',
          errors: [{ messageId: 'anonymousType' }],
        },
        {
          code: 'function f(): { id: string } { return { id: "1" }; }',
          errors: [{ messageId: 'anonymousType' }],
        },
        {
          code: 'class C { method(x: { id: string }) {} }',
          errors: [{ messageId: 'anonymousType' }],
        },
        {
          code: 'function f({ id }: { id: string }) {}',
          errors: [{ messageId: 'anonymousType' }],
        },
      ],
    });
  });

  it('param-count', () => {
    ruleTester.run('param-count', rules.rules['param-count'], {
      valid: [
        'class C { constructor(a, b) {} }',
        'class C { method(a, b, c) {} }',
        'class C { fn = (a, b, c) => {}; }',
        'function f(a, b, c, d, e) {}',
        'const f = (a, b, c, d, e) => {};',
      ],
      invalid: [
        {
          code: 'class C { constructor(a, b, c) {} }',
          errors: [{ messageId: 'tooManyParams', data: { kind: 'Constructor', count: '3', max: '2' } }],
        },
        {
          code: 'class C { method(a, b, c, d) {} }',
          errors: [{ messageId: 'tooManyParams', data: { kind: 'Method', count: '4', max: '3' } }],
        },
        {
          code: 'class C { fn = (a, b, c, d) => {}; }',
          errors: [{ messageId: 'tooManyParams', data: { kind: 'Method', count: '4', max: '3' } }],
        },
        {
          code: 'class C { constructor(a, b, c, d) {} }',
          options: [{ constructor: 3, method: 3 }],
          errors: [{ messageId: 'tooManyParams', data: { kind: 'Constructor', count: '4', max: '3' } }],
        },
      ],
    });
  });
});
