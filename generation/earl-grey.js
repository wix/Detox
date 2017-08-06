const t = require("babel-types");
const objectiveCParser = require("objective-c-parser");
const generate = require("babel-generator").default;
const fs = require("fs");
const {
  isNumber,
  isString,
  isBoolean,
  isPoint,
  isOneOf,
} = require('./type-checks');
const {
  methodNameToSnakeCase,
} = require('./helpers');

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
    t.classBody(json.methods.map(createMethod.bind(null, json.name))),
    []
  );
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


const supportedTypesMap = {
  'NSUInteger': 'NSInteger',
  'NSString *': 'NSString',
};

function sanitizeArgument(json) {
  if (supportedTypesMap[json.type]) {
    return Object.assign({}, json, {
      type: supportedTypesMap[json.type],
    });
  }
  return json;
}

function createMethodBody(className, json) {
  const sanitizedJson = Object.assign({}, json, { 
    args: json.args.map(argJson => sanitizeArgument(argJson)),
  });

  const allTypeChecks = createTypeChecks(sanitizedJson).reduce((carry, item) => item instanceof Array ? [...carry, ...item] : [...carry, item], []);
  const typeChecks = allTypeChecks.filter(check => typeof check === "object");
  const returnStatement = createReturnStatement(className, sanitizedJson);
  return [...typeChecks, returnStatement]
}

function createTypeChecks(json) {
  const checks = json.args.map(createTypeCheck);
  checks.filter(check => Boolean(check));
  return checks;
}

function createReturnStatement(className, json) {
  const args = json.args.map(arg => t.objectExpression([
    t.objectProperty(t.identifier('type'), t.stringLiteral(arg.type)),
    t.objectProperty(t.identifier('value'), t.identifier(arg.name)),
  ]));

  return t.returnStatement(t.objectExpression([
    t.objectProperty(
      t.identifier('target'), 
      t.objectExpression([
        t.objectProperty(t.identifier('type'), t.stringLiteral('Class')),
        t.objectProperty(t.identifier('value'), t.stringLiteral(className)),
      ])
    ),
    t.objectProperty(
      t.identifier('method'), 
      t.stringLiteral(json.name)
    ),
    t.objectProperty(
      t.identifier('args'), 
      t.arrayExpression(args)
    ),
  ]));
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
    GREYDirection: isOneOf(["Left", "Right", "Up", "Down"]),
    GREYContentEdge: isOneOf(["Left", "Right", "Top", "Bottom"]),
    GREYPinchDirection: isOneOf(["Outward", "Inward"])
  };

  const typeCheckCreator = typeInterfaces[json.type];
  const isListOfChecks = typeCheckCreator instanceof Array;

  if (typeof typeCheckCreator !== "function" && !isListOfChecks) {
    console.info("Could not find ", json);
    return;
  }

  return isListOfChecks ? 
    typeCheckCreator.map(singleCheck => singleCheck(json)) : 
    typeCheckCreator(json);
}

module.exports = function(files) {
  Object.entries(files).forEach(([inputFile, outputFile]) => {
    const input = fs.readFileSync(inputFile, "utf8");

    const json = objectiveCParser(input);
    const ast = t.program([createClass(json), createExport(json)]);
    const output = generate(ast, {
      auxiliaryCommentBefore: '\n\tThis code is generated.\n\tFor more information see generation/README.md.\n'
    });

    fs.writeFileSync(outputFile, output.code, "utf8");
  });
};
