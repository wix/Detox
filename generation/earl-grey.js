const t = require("babel-types");
const objectiveCParser = require("objective-c-parser");
const generate = require("babel-generator").default;
const fs = require("fs");

function createClass(json) {
  return t.classDeclaration(
    t.identifier(json.name),
    null,
    t.classBody(json.methods.map(createMethod)),
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

function createMethod(json) {
  const m = t.classMethod(
    "method",
    t.identifier(json.name.replace(/\:/g, "")),
    json.args.map(createArgument),
    t.blockStatement(createMethodBody(json)),
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

function createArgument(json) {
  return t.identifier(json.name);
}

function createMethodBody(json) {
  const typeChecks = createTypeChecks(json);

  return typeChecks.filter(check => typeof check === "object");
}

function createTypeChecks(json) {
  const checks = json.args.map(createTypeCheck);
  checks.filter(check => Boolean(check));
  return checks;
}

function createTypeCheck(json) {
  // if (typeof argName === 'number') {
  //   throw new Error('argName should be a number, but got ' + argName);
  // }
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

  const typeCheckTestGenerator = typeAssertion => ({ name }) =>
    t.binaryExpression(
      "!==",
      t.unaryExpression("typeof", t.identifier(name)),
      t.stringLiteral(typeAssertion)
    );

  const typeCheckErrorGenerator = typeAssertion => ({ name }) =>
    t.binaryExpression(
      "+",
      t.stringLiteral(name + " should be a " + typeAssertion + ", but got "),
      t.identifier(name)
    );

  const generateTypeCheck = typeAssertion =>
    generateCheck(
      typeCheckTestGenerator(typeAssertion),
      typeCheckErrorGenerator(typeAssertion)
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
  const isPoint = generateTypeCheck("object"); //(x, y) => isNumber(x) && isNumber(y);
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
  if (typeof typeCheckCreator !== "function") {
    console.info("Could not find ", json);
    return;
  }

  return typeCheckCreator(json);
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
