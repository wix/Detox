const t = require("babel-types");
const template = require("babel-template");
const objectiveCParser = require("objective-c-parser");
const generate = require("babel-generator").default;
const fs = require("fs");

const { methodNameToSnakeCase } = require("../helpers");

const {
  generateTypeCheck,
  generateIsOneOfCheck
} = require("babel-generate-guard-clauses");

const isNumber = generateTypeCheck("number");
const isString = generateTypeCheck("string");
const isBoolean = generateTypeCheck("boolean");
const isPoint = [
  generateTypeCheck("object"),
  generateTypeCheck("number", { selector: "x" }),
  generateTypeCheck("number", { selector: "y" })
];
const isOneOf = generateIsOneOfCheck;
const isGreyMatcher = ({ name }) => template(`
  if (
    typeof ARG !== "object" || 
    ARG.type !== "Invocation" ||
    typeof ARG.value !== "object" || 
    typeof ARG.value.target !== "object" ||
    ARG.value.target.value !== "GREYMatchers"
  ) {
    throw new Error('${name} should be a GREYMatcher, but got ' + JSON.stringify(ARG));
  }
`)({
    ARG: t.identifier(name)
  });
const isArray = ({ name }) => template(`
if (
  (typeof ARG !== 'object') || 
  (!ARG instanceof Array)
) {
    throw new Error('TraitsMatcher ctor argument must be an array, got ' + typeof ARG);
  }
`)({
    ARG: t.identifier(name)
  });


// Constants
const SUPPORTED_TYPES = [
  "CGFloat",
  "CGPoint",
  "GREYContentEdge",
  "GREYDirection",
  "NSInteger",
  "NSString *",
  "NSString",
  "NSUInteger",
  "id<GREYMatcher>",
  "UIAccessibilityTraits"
];

/**
 * the input provided by objective-c-parser looks like this:
 * {
 *   "name": "BasicName",
 *   "methods": [
 *     {
 *       "args": [],
 *       "comment": "This is the comment of basic method one",
 *       "name": "basicMethodOne",
 *       "returnType": "NSInteger"
 *     },
 *     {
 *       "args": [
 *         {
 *           "type": "NSInteger",
 *           "name": "argOne"
 *         },
 *         {
 *           "type": "NSString",
 *           "name": "argTwo"
 *         }
 *       ],
 *       "comment": "This is the comment of basic method two.\nIt has multiple lines",
 *       "name": "basicMethodTwoWithArgOneAndArgTwo",
 *       "returnType": "NSString"
 *     }
 *   ]
 * }
 */
function createClass(json) {
  return t.classDeclaration(
    t.identifier(json.name),
    null,
    t.classBody(json.methods.filter(filterMethodsWithUnsupportedParams).map(createMethod.bind(null, json.name))),
    []
  );
}

function filterMethodsWithUnsupportedParams(method) {
  return method.args.reduce((carry, methodArg) => carry && SUPPORTED_TYPES.includes(methodArg.type), true);
}

function createExport(json) {
  return t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.memberExpression(
        t.identifier("module"),
        t.identifier("exports"),
        false
      ),
      t.identifier(json.name)
    )
  );
}

function createMethod(className, json) {
  const m = t.classMethod(
    "method",
    t.identifier(methodNameToSnakeCase(json.name)),
    json.args.map(({ name }) => t.identifier(name)),
    t.blockStatement(createMethodBody(className, json)),
    false,
    json.static
  );

  if (json.comment) {
    const comment = {
      type: json.comment.indexOf("\n") === -1 ? "LineComment" : "BlockComment",
      value: json.comment + "\n"
    };

    m.leadingComments = m.leadingComments || [];
    m.leadingComments.push(comment);
  }
  return m;
}

const renameTypesMap = {
  NSUInteger: "NSInteger",
  "NSString *": "NSString"
};

function sanitizeArgumentType(json) {
  if (renameTypesMap[json.type]) {
    return Object.assign({}, json, {
      type: renameTypesMap[json.type]
    });
  }
  return json;
}

function createMethodBody(className, json) {
  const sanitizedJson = Object.assign({}, json, {
    args: json.args.map(argJson => sanitizeArgumentType(argJson))
  });

  const allTypeChecks = createTypeChecks(sanitizedJson).reduce(
    (carry, item) =>
      item instanceof Array ? [...carry, ...item] : [...carry, item],
    []
  );
  const typeChecks = allTypeChecks.filter(check => typeof check === "object");
  const returnStatement = createReturnStatement(className, sanitizedJson);
  return [...typeChecks, returnStatement];
}

function createTypeChecks(json) {
  const checks = json.args.map(createTypeCheck);
  checks.filter(check => Boolean(check));
  return checks;
}

const callGlobal = sanitizerName => argIdentifier =>
  t.callExpression(t.identifier(sanitizerName), [t.identifier(argIdentifier)]);
const supportedContentSanitizersMap = {
  GREYDirection: {
    type: "NSInteger",
    value: callGlobal("sanitize_greyDirection")
  },
  GREYContentEdge: {
    type: "NSInteger",
    value: callGlobal("sanitize_greyContentEdge")
  },
  UIAccessibilityTraits: {
    type: "NSInteger",
    value: callGlobal("sanitize_uiAccessibilityTraits")
  }
};
function addArgumentContentSanitizerCall(json) {
  if (supportedContentSanitizersMap[json.type]) {
    return supportedContentSanitizersMap[json.type].value(json.name);
  }

  return t.identifier(json.name);
}
function addArgumentTypeSanitizer(json) {
  if (supportedContentSanitizersMap[json.type]) {
    return supportedContentSanitizersMap[json.type].type;
  }

  return json.type;
}

// These types need no wrapping with {type: ..., value: }
const plainArgumentTypes = ["id<GREYMatcher>"];
function shouldBeWrapped({ type }) {
  return !plainArgumentTypes.includes(type);
}
function createReturnStatement(className, json) {
  const args = json.args.map(arg => shouldBeWrapped(arg) ?
    t.objectExpression([
      t.objectProperty(
        t.identifier("type"),
        t.stringLiteral(addArgumentTypeSanitizer(arg))
      ),
      t.objectProperty(
        t.identifier("value"),
        addArgumentContentSanitizerCall(arg)
      )
    ]) : addArgumentContentSanitizerCall(arg)
  );

  return t.returnStatement(
    t.objectExpression([
      t.objectProperty(
        t.identifier("target"),
        t.objectExpression([
          t.objectProperty(t.identifier("type"), t.stringLiteral("Class")),
          t.objectProperty(t.identifier("value"), t.stringLiteral(className))
        ])
      ),
      t.objectProperty(t.identifier("method"), t.stringLiteral(json.name)),
      t.objectProperty(t.identifier("args"), t.arrayExpression(args))
    ])
  );
}

function createTypeCheck(json) {
  const typeInterfaces = {
    NSInteger: isNumber,
    CGFloat: isNumber,
    CGPoint: isPoint,
    CFTimeInterval: isNumber,
    double: isNumber,
    float: isNumber,
    NSString: isString,
    BOOL: isBoolean,
    "NSDate *": isNumber,
    GREYDirection: isOneOf(["left", "right", "up", "down"]),
    GREYContentEdge: isOneOf(["left", "right", "top", "bottom"]),
    GREYPinchDirection: isOneOf(["outward", "inward"]),
    "id<GREYMatcher>": isGreyMatcher,
    UIAccessibilityTraits: isArray,
  };

  const typeCheckCreator = typeInterfaces[json.type];
  const isListOfChecks = typeCheckCreator instanceof Array;

  return isListOfChecks
    ? typeCheckCreator.map(singleCheck => singleCheck(json))
    : typeCheckCreator(json);
}

module.exports = function(files) {
  Object.entries(files).forEach(([inputFile, outputFile]) => {
    const input = fs.readFileSync(inputFile, "utf8");

    const json = objectiveCParser(input);
    const ast = t.program([createClass(json), createExport(json)]);
    const output = generate(ast);

    const commentBefore = "/**\n\n\tThis code is generated.\n\tFor more information see generation/README.md.\n*/\n\n";

    // Add global helper functions
    const globalFunctionsSource = fs.readFileSync(__dirname + "/global-functions.js", "utf8");
    const globalFunctions = globalFunctionsSource.substr(0, globalFunctionsSource.indexOf("module.exports"));

    const code = [commentBefore, globalFunctions, output.code].join('\n');
    fs.writeFileSync(outputFile, code, "utf8");

    // Output methods that were not created due to missing argument support
    const unsupportedMethods = json.methods.filter(x => !filterMethodsWithUnsupportedParams(x));
    if (unsupportedMethods.length) {
      console.log(`Could not generate the following methods for ${json.name}`);
      unsupportedMethods.forEach(method => {
        const methodArgs = method.args.filter(methodArg => !SUPPORTED_TYPES.includes(methodArg.type)).map(methodArg => methodArg.type);
        console.log(`\t ${method.name} misses ${methodArgs}`);
      });
    }
  });
};
