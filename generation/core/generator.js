const t = require('@babel/types');
const template = require('@babel/template').default;
const generate = require('@babel/generator').default;
const javaMethodParser = require('java-method-parser');
const fs = require('fs');
const path = require('path');

const { methodNameToSnakeCase } = require('../helpers');
let globalFunctionUsage = {};
module.exports = function getGenerator({
  typeCheckInterfaces,
  renameTypesMap,
  supportedTypes,
  classValue,
  contentSanitizersForFunction,
  contentSanitizersForType,
  blacklistedFunctionNames = []
}) {
  function createClass(json) {
    return t.classDeclaration(
      t.identifier(json.name),
      null,
      t.classBody(
        json.methods
          .filter(filterMethodsWithUnsupportedParams)
          .filter(filterMethodsWithBlacklistedName)
          .reduce(handleOverloadedMethods, [])
          .map(createMethod.bind(null, json))
      ),
      []
    );
  }

  function filterMethodsWithBlacklistedName({ name }) {
    return !blacklistedFunctionNames.find((blacklisted) => name.indexOf(blacklisted) !== -1);
  }

  function filterMethodsWithUnsupportedParams(method) {
    return method.args.reduce((carry, methodArg) => {
      if (methodArg === null) {
        console.error(method);
      }
      return carry && supportedTypes.includes(methodArg.type);
    }, true);
  }

  function handleOverloadedMethods(list, method) {
    const methodInstance = {
      args: method.args
    };

    const firstDeclaration = list.find((item) => item.name === method.name);
    if (firstDeclaration) {
      firstDeclaration.instances.push(methodInstance);
      return list;
    }

    return list.concat(Object.assign({}, method, { instances: [methodInstance] }));
  }

  function createExport(json) {
    return t.expressionStatement(
      t.assignmentExpression('=', t.memberExpression(t.identifier('module'), t.identifier('exports'), false), t.identifier(json.name))
    );
  }

  const blacklistedArgumentTypes = ['__strong NSError **'];
  function filterBlacklistedArguments(arg) {
    return !blacklistedArgumentTypes.includes(arg.type);
  }

  function createMethod(classJson, json) {
    const isOverloading = json.instances.length > 1;
    if (isOverloading && hasProblematicOverloading(json.instances)) {
      console.log(classJson, json);
      throw 'Could not handle this overloaded method';
    }

    json.args = json.args.filter(filterBlacklistedArguments);
    // Args might be unused due to overloading
    const args = json.args.map(({ name }) => t.identifier(name));

    if (!json.static) {
      const prefixedArgs = [t.identifier('element')];
      args.unshift(...prefixedArgs);
      json.prefixedArgs = prefixedArgs;
    }

    const body = isOverloading ? createOverloadedMethodBody(classJson, json) : createMethodBody(classJson, json);

    const m = t.classMethod('method', t.identifier(methodNameToSnakeCase(json.name)), args, body, false, true);

    if (json.comment) {
      t.addComment(m, 'leading', json.comment);
    }
    return m;
  }

  function createOverloadedMethodBody(classJson, json) {
    const sanitizedName = methodNameToSnakeCase(json.name);
    // Lets create an inline function for each of the instances
    // for this let's construct a JSON like we would need it
    // name: thisName_argLength
    // static: false
    // args: instance.args
    // Let's check the length of the call and use the matching one of the instances then

    const overloadFunctionExpressions = json.instances.map(({ args }) => {
      const params = [...(json.prefixedArgs || []), ...args];
      return t.functionDeclaration(
        t.identifier(sanitizedName + params.length),
        params.filter(filterBlacklistedArguments).map(({ name }) => t.identifier(name)),
        createMethodBody(classJson, Object.assign({}, json, { args }))
      );
    });

    const offset = (json.prefixedArgs || []).length;
    const returnStatementsForNumber = (num) =>
      template(`
      if (arguments.length === ${num + offset}) {
        return ${sanitizedName + (num + offset)}.apply(null, arguments);
      }
    `)();

    const returns = json.instances.map(({ args }) => returnStatementsForNumber(args.length));

    return t.blockStatement([...overloadFunctionExpressions, ...returns]);
  }

  // We don't handle same lengthed argument sets right now.
  // In the future we could write the type checks in a way that
  // would allow us to do an either or switch in this case
  function hasProblematicOverloading(instances) {
    // Check if there are same lengthed argument sets
    const knownLengths = [];
    return instances
      .map(({ args }) => args.length)
      .reduce((carry, item) => {
        if (carry || knownLengths.some((l) => l === item)) {
          return true;
        }

        knownLengths.push(item);
        return false;
      }, false);
  }

  function sanitizeArgumentType(json) {
    if (renameTypesMap[json.type]) {
      return Object.assign({}, json, {
        type: renameTypesMap[json.type]
      });
    }
    return json;
  }

  function createMethodBody(classJson, json) {
    const sanitizedJson = Object.assign({}, json, {
      args: json.args.map((argJson) => sanitizeArgumentType(argJson))
    });

    const allTypeChecks = createTypeChecks(sanitizedJson, sanitizedJson.name).reduce(
      (carry, item) => (item instanceof Array ? [...carry, ...item] : [...carry, item]),
      []
    );
    const typeChecks = allTypeChecks.filter((check) => typeof check === 'object' && check.type !== 'EmptyStatement');
    const returnStatement = createReturnStatement(classJson, sanitizedJson);
    return t.blockStatement([...typeChecks, returnStatement]);
  }

  function createTypeChecks(json, functionName) {
    const checks = json.args.map((arg) => createTypeCheck(arg, functionName));
    checks.filter((check) => Boolean(check));
    return checks;
  }

  function addArgumentContentSanitizerCall(json, functionName) {
    if (contentSanitizersForType[json.type]) {
      globalFunctionUsage[contentSanitizersForType[json.type].name] = true;
      return contentSanitizersForType[json.type].value(json.name);
    }

    if (contentSanitizersForFunction[functionName] && contentSanitizersForFunction[functionName].argumentName === json.name) {
      globalFunctionUsage[contentSanitizersForFunction[functionName].name] = true;
      return contentSanitizersForFunction[functionName].value(json.name);
    }

    return t.identifier(json.name);
  }

  function addArgumentTypeSanitizer(json) {
    if (contentSanitizersForType[json.type]) {
      return contentSanitizersForType[json.type].type;
    }

    return json.type;
  }

  // These types need no wrapping with {type: ..., value: }
  const plainArgumentTypes = [
    'id',
    'id<GREYAction>',
    'id<GREYMatcher>',
    'GREYElementInteraction*',
    'String',
    'ArrayList<Object>',
    'ArrayList<String>',
    'ViewAction'
  ];

  function shouldBeWrapped({ type }) {
    return !plainArgumentTypes.includes(type);
  }

  function createReturnStatement(classJson, json) {
    const args = json.args.map((arg) =>
      shouldBeWrapped(arg)
        ? t.objectExpression([
            t.objectProperty(t.identifier('type'), t.stringLiteral(addArgumentTypeSanitizer(arg))),
            t.objectProperty(t.identifier('value'), addArgumentContentSanitizerCall(arg, json.name))
          ])
        : addArgumentContentSanitizerCall(arg, json.name)
    );

    return t.returnStatement(
      t.objectExpression([
        t.objectProperty(
          t.identifier('target'),
          json.static
            ? t.objectExpression([
                t.objectProperty(t.identifier('type'), t.stringLiteral('Class')),
                t.objectProperty(t.identifier('value'), t.stringLiteral(classValue(classJson)))
              ])
            : t.identifier('element')
        ),
        t.objectProperty(t.identifier('method'), t.stringLiteral(json.name)),
        t.objectProperty(t.identifier('args'), t.arrayExpression(args))
      ])
    );
  }

  function createTypeCheck(json, functionName) {
    const optionalSanitizer = contentSanitizersForFunction[functionName];
    const type = optionalSanitizer && optionalSanitizer.argumentName === json.name ? optionalSanitizer.newType : json.type;
    const typeCheckCreator = typeCheckInterfaces[type];
    const isListOfChecks = typeCheckCreator instanceof Array;
    return isListOfChecks
      ? typeCheckCreator.map((singleCheck) => singleCheck(json, functionName))
      : typeCheckCreator instanceof Function
      ? typeCheckCreator(json, functionName)
      : t.emptyStatement();
  }

  function createLogImport(pathFragments) {
    const fragments = [...pathFragments];
    fragments.pop(); // remove filename
    const outputPath = fragments.join('/');
    const absoluteUtilsPath = path.resolve('../detox/src/utils');
    const relativeUtilsPath = path.relative(outputPath, absoluteUtilsPath);

    return `const log = require('${relativeUtilsPath}/logger').child({ __filename });\n` + `const util = require('util');\n`;
  }

  return function generator(files) {
    Object.entries(files).forEach(([inputFile, outputFile]) => {
      console.log(`\n\r${inputFile} => ${outputFile}`);

      globalFunctionUsage = {};
      const input = fs.readFileSync(inputFile, 'utf8');
      const json = javaMethodParser(input);

      // set default name
      const pathFragments = outputFile.split('/');
      if (!json.name) {
        json.name = pathFragments[pathFragments.length - 1].replace('.js', '');
      }
      const ast = t.program([createClass(json), createExport(json)]);
      const output = generate(ast);

      const commentBefore = '/**\n\n\tThis code is generated.\n\tFor more information see generation/README.md.\n*/\n\n';

      // Add global helper functions
      const globalFunctionsStr = fs.readFileSync(__dirname + '/global-functions.js', 'utf8');
      const globalFunctionsSource = globalFunctionsStr.substr(0, globalFunctionsStr.indexOf('module.exports'));

      // Only include global functions that are actually used
      const usedGlobalFunctions = Object.entries(globalFunctionUsage)
        .filter(([key, value]) => value)
        .map(([key]) => key);
      const globalFunctions = usedGlobalFunctions
        .map((name) => {
          const start = globalFunctionsSource.indexOf(`function ${name}`);
          const end = globalFunctionsSource.indexOf(`// END ${name}`);
          return globalFunctionsSource.substr(start, end - start);
        })
        .join('\n');

      // TODO: add createLogImport(pathFragments) again
      const code = [commentBefore, globalFunctions, output.code].join('\n');
      fs.writeFileSync(outputFile, code, 'utf8');

      // Output methods that were not created due to missing argument support
      const unsupportedMethods = json.methods.filter((x) => !filterMethodsWithUnsupportedParams(x));
      if (unsupportedMethods.length) {
        console.log(`Could not generate the following methods for ${json.name}`);
        unsupportedMethods.forEach((method) => {
          const methodArgs = method.args.filter((methodArg) => !supportedTypes.includes(methodArg.type)).map((methodArg) => methodArg.type);
          console.log(`\t ${method.name} misses ${methodArgs}`);
        });
      }
    });
  };
};
