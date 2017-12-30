const t = require("babel-types");
const template = require("babel-template");
const objectiveCParser = require("objective-c-parser");
const javaMethodParser = require("java-method-parser");
const generate = require("babel-generator").default;
const fs = require("fs");

const { methodNameToSnakeCase } = require("../helpers");
let globalFunctionUsage = {};
module.exports = function({
	typeCheckInterfaces,
	renameTypesMap,
	supportedTypes,
	classValue,
	supportedContentSanitizersMap
}) {
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
			t.classBody(
				json.methods
					.filter(filterMethodsWithUnsupportedParams)
					.map(createMethod.bind(null, json))
			),
			[]
		);
	}

	function filterMethodsWithUnsupportedParams(method) {
		return method.args.reduce(
			(carry, methodArg) => carry && supportedTypes.includes(methodArg.type),
			true
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

	function createMethod(classJson, json) {
		const m = t.classMethod(
			"method",
			t.identifier(methodNameToSnakeCase(json.name)),
			json.args.map(({ name }) => t.identifier(name)),
			t.blockStatement(createMethodBody(classJson, json)),
			false,
			json.static
		);

		if (json.comment) {
			const comment = {
				type:
					json.comment.indexOf("\n") === -1 ? "LineComment" : "BlockComment",
				value: json.comment + "\n"
			};

			m.leadingComments = m.leadingComments || [];
			m.leadingComments.push(comment);
		}
		return m;
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
			args: json.args.map(argJson => sanitizeArgumentType(argJson))
		});

		const allTypeChecks = createTypeChecks(sanitizedJson).reduce(
			(carry, item) =>
				item instanceof Array ? [...carry, ...item] : [...carry, item],
			[]
		);
		const typeChecks = allTypeChecks.filter(check => typeof check === "object");
		const returnStatement = createReturnStatement(classJson, sanitizedJson);
		return [...typeChecks, returnStatement];
	}

	function createTypeChecks(json) {
		const checks = json.args.map(createTypeCheck);
		checks.filter(check => Boolean(check));
		return checks;
	}

	function addArgumentContentSanitizerCall(json) {
		if (supportedContentSanitizersMap[json.type]) {
			globalFunctionUsage[supportedContentSanitizersMap[json.type].name] = true;
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
	function createReturnStatement(classJson, json) {
		const args = json.args.map(
			arg =>
				shouldBeWrapped(arg)
					? t.objectExpression([
							t.objectProperty(
								t.identifier("type"),
								t.stringLiteral(addArgumentTypeSanitizer(arg))
							),
							t.objectProperty(
								t.identifier("value"),
								addArgumentContentSanitizerCall(arg)
							)
						])
					: addArgumentContentSanitizerCall(arg)
		);

		return t.returnStatement(
			t.objectExpression([
				t.objectProperty(
					t.identifier("target"),
					t.objectExpression([
						t.objectProperty(t.identifier("type"), t.stringLiteral("Class")),
						t.objectProperty(
							t.identifier("value"),
							t.stringLiteral(classValue(classJson))
						)
					])
				),
				t.objectProperty(t.identifier("method"), t.stringLiteral(json.name)),
				t.objectProperty(t.identifier("args"), t.arrayExpression(args))
			])
		);
	}

	function createTypeCheck(json) {
		const typeCheckCreator = typeCheckInterfaces[json.type];
		const isListOfChecks = typeCheckCreator instanceof Array;
		return isListOfChecks
			? typeCheckCreator.map(singleCheck => singleCheck(json))
			: typeCheckCreator(json);
	}

	return function(files) {
		Object.entries(files).forEach(([inputFile, outputFile]) => {
			globalFunctionUsage = {};
			const input = fs.readFileSync(inputFile, "utf8");
			const isObjectiveC = inputFile[inputFile.length - 1] === "h";

			const json = isObjectiveC
				? objectiveCParser(input)
				: javaMethodParser(input);
			const ast = t.program([createClass(json), createExport(json)]);
			const output = generate(ast);

			const eslintDisableComment = "/* eslint-disable */";
			const commentBefore =
				"/**\n\n\tThis code is generated.\n\tFor more information see generation/README.md.\n*/\n\n";

			// Add global helper functions
			const globalFunctionsStr = fs.readFileSync(
				__dirname + "/global-functions.js",
				"utf8"
			);
			const globalFunctionsSource = globalFunctionsStr.substr(
				0,
				globalFunctionsStr.indexOf("module.exports")
			);

			// Only include global functions that are actually used
			const usedGlobalFunctions = Object.entries(globalFunctionUsage)
				.filter(([key, value]) => value)
				.map(([key]) => key);
			const globalFunctions = usedGlobalFunctions
				.map(name => {
					const start = globalFunctionsSource.indexOf(`function ${name}`);
					const end = globalFunctionsSource.indexOf(`// END ${name}`);
					return globalFunctionsSource.substr(start, end - start);
				})
				.join("\n");

			const code = [
				eslintDisableComment,
				commentBefore,
				globalFunctions,
				output.code
			].join("\n");
			fs.writeFileSync(outputFile, code, "utf8");

			// Output methods that were not created due to missing argument support
			const unsupportedMethods = json.methods.filter(
				x => !filterMethodsWithUnsupportedParams(x)
			);
			if (unsupportedMethods.length) {
				console.log(
					`Could not generate the following methods for ${json.name}`
				);
				unsupportedMethods.forEach(method => {
					const methodArgs = method.args
						.filter(methodArg => !supportedTypes.includes(methodArg.type))
						.map(methodArg => methodArg.type);
					console.log(`\t ${method.name} misses ${methodArgs}`);
				});
			}
		});
	};
};
