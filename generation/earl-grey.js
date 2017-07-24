const t = require("babel-types");
const objectiveCParser = require("objective-c-parser");
const generate = require("babel-generator").default;
const fs = require("fs");

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
    t.identifier(json.name.replace(/\:/g, "")),
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

function createMethodBody(className, json) {
  const allTypeChecks = createTypeChecks(json).reduce((carry, item) => item instanceof Array ? [...carry, ...item] : [...carry, item], []);
  const typeChecks = allTypeChecks.filter(check => typeof check === "object");
  const returnStatement = createReturnStatement(className, json);
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
      t.stringLiteral(json.name.replace(/\:/g, ""))
    ),
    t.objectProperty(
      t.identifier('args'), 
      t.arrayExpression(args)
    ),
  ]));
}

function createTypeCheck(json) {
  const generateCheck = (checkGenerator, errorStringGenerator) => ({
    type,
    name
  }) =>
    t.ifStatement(
      checkGenerator({ type, name }),
      t.throwStatement(
        t.newExpression(t.identifier("Error"), [errorStringGenerator({ name })])
      )
    );

  // if (typeof argName === 'number') {
  //   throw new Error('argName should be a number, but got ' + argName + '(' + typeof argName +  ')');
  // }

  const typeCheckTestGenerator = (typeAssertion, options) => ({ name }) =>
    t.binaryExpression(
      "!==",
      t.unaryExpression("typeof", options.selector ? t.memberExpression(t.identifier(name), t.identifier(options.selector)) : t.identifier(name)),
      t.stringLiteral(typeAssertion)
    );

  const typeCheckErrorGenerator = (typeAssertion, options) => ({ name }) => {
    const nameString = options.selector ? `${name}.${options.selector}` : name;
    const nameAst = options.selector ? 
      t.memberExpression(t.identifier(name), t.identifier(options.selector)) : 
      t.identifier(name);
    
    return t.binaryExpression(
      "+",
      t.stringLiteral(nameString + " should be a " + typeAssertion + ", but got "),
      t.binaryExpression("+", 
        nameAst, 
        t.binaryExpression("+", 
          t.stringLiteral(" ("), 
          t.binaryExpression("+",
            t.unaryExpression("typeof", nameAst),
            t.stringLiteral(")")
          )
        )
      ) 
    );
  }
 
  const generateTypeCheck = (typeAssertion, options={}) =>
    generateCheck(
      typeCheckTestGenerator(typeAssertion, options),
      typeCheckErrorGenerator(typeAssertion, options)
    );

  const oneOfCheckTestGenerator = options => ({ name }) =>
    t.unaryExpression(
      "!",
      t.callExpression(
        t.memberExpression(
          t.arrayExpression(options.map(option => t.stringLiteral(option))),
          t.identifier("some")
        ),
        [
          t.arrowFunctionExpression(
            [t.identifier("option")],
            t.binaryExpression(
              "===",
              t.identifier("option"),
              t.identifier(name)
            )
          )
        ]
      )
    );

  const oneOfCheckErrorGenerator = options => ({ name }) =>
    t.binaryExpression(
      "+",
      t.stringLiteral(
        name + " should be one of [" + options.join(", ") + "], but got "
      ),
      t.identifier(name)
    );

  const isNumber = generateTypeCheck("number");
  const isString = generateTypeCheck("string");
  const isBoolean = generateTypeCheck("boolean");
  const isPoint = [
    generateTypeCheck("object"), 
    generateTypeCheck("number", {selector: 'x'}), 
    generateTypeCheck("number", {selector: 'y'})
  ];
  
  const isOneOf = options =>
    generateCheck(
      oneOfCheckTestGenerator(options),
      oneOfCheckErrorGenerator(options)
    );

  const typeInterfaces = {
    NSUInteger: isNumber,
    NSInteger: isNumber,
    CGFloat: isNumber,
    CGPoint: isPoint,
    CFTimeInterval: isNumber,
    double: isNumber,
    float: isNumber,
    NSString: isString,
    "NSString *": isString,
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
    const output = generate(ast);

    fs.writeFileSync(outputFile, output.code, "utf8");
  });
};
