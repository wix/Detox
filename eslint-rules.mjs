import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/wix/Detox/blob/master/eslint-rules.mjs#${name}`,
);

const FUNCTION_LIKE = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'TSFunctionType',
  'TSMethodSignature',
  'TSCallSignatureDeclaration',
  'TSConstructSignatureDeclaration',
  'TSDeclareFunction',
  'TSEmptyBodyFunctionExpression',
]);

/**
 * Scope is deliberately narrow: only casts and function param/return
 * annotations are flagged. Property annotations, variable annotations, and
 * literals nested inside an already-named `interface`/`type` body are left
 * alone — those are the shape's one legitimate definition site, not a
 * duplicate escape hatch.
 */
const noAnonymousObjectType = createRule({
  name: 'no-anonymous-object-type',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow anonymous object type literals in `as`/type-assertion casts and in function parameter/return type annotations. Extract a named interface or type alias instead.',
    },
    schema: [],
    messages: {
      anonymousType:
        'Anonymous object type literal — extract it to a named interface or type alias instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSTypeLiteral(node) {
        const parent = node.parent;
        if (!parent) return;

        if (parent.type === AST_NODE_TYPES.TSAsExpression || parent.type === AST_NODE_TYPES.TSTypeAssertion) {
          context.report({ node, messageId: 'anonymousType' });
          return;
        }

        if (parent.type !== AST_NODE_TYPES.TSTypeAnnotation) return;

        const holder = parent.parent;
        if (!holder) return;

        if (FUNCTION_LIKE.has(holder.type)) {
          // `holder` IS the function-like node: this is its return type.
          context.report({ node, messageId: 'anonymousType' });
          return;
        }

        const fn = holder.parent;
        if (fn && FUNCTION_LIKE.has(fn.type) && Array.isArray(fn.params) && fn.params.includes(holder)) {
          // `holder` is one of `fn`'s params (plain identifier or a
          // destructured pattern) and carries the annotation directly.
          context.report({ node, messageId: 'anonymousType' });
        }
      },
    };
  },
});

/**
 * Scope: class constructors and methods only (including arrow-function class
 * fields used as methods). Plain top-level functions are intentionally left
 * alone for now.
 */
const paramCount = createRule({
  name: 'param-count',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Limit the number of parameters a constructor or method may declare. Group extra parameters into an options object instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          constructor: { type: 'number' },
          method: { type: 'number' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyParams:
        '{{kind}} has {{count}} parameters, max allowed is {{max}}. Consider grouping them into an options object.',
    },
  },
  defaultOptions: [{ constructor: 2, method: 3 }],
  create(context, [options]) {
    function check(node, kind, max) {
      if (node.params.length > max) {
        context.report({
          node,
          messageId: 'tooManyParams',
          data: { kind, count: node.params.length, max },
        });
      }
    }

    return {
      'MethodDefinition[kind="constructor"] > FunctionExpression'(node) {
        check(node, 'Constructor', options.constructor);
      },
      'MethodDefinition[kind="method"] > FunctionExpression'(node) {
        check(node, 'Method', options.method);
      },
      'TSAbstractMethodDefinition[kind="method"] > TSEmptyBodyFunctionExpression'(node) {
        check(node, 'Method', options.method);
      },
      'PropertyDefinition > ArrowFunctionExpression'(node) {
        check(node, 'Method', options.method);
      },
      'PropertyDefinition > FunctionExpression'(node) {
        check(node, 'Method', options.method);
      },
    };
  },
});

export default {
  rules: {
    'no-anonymous-object-type': noAnonymousObjectType,
    'param-count': paramCount,
  },
};
