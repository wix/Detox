const t = require("babel-types");

// Some helper methods to easily stick together type checks
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

module.exports = {
  isNumber,
  isString,
  isBoolean,
  isPoint,
  isOneOf,
}