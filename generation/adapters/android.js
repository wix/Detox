const t = require("babel-types");
const generator = require("../core/generator");

const { isNumber, isString, isBoolean } = require("../core/type-checks");
const { callGlobal } = require("../helpers");

const typeCheckInterfaces = {
	Integer: isNumber,
	Double: isNumber,
	String: isString,
	boolean: isBoolean
};

const contentSanitizersForFunction = {
	scrollInDirection: {
		argumentName: "direction",
		newType: "String",
		name: "sanitize_android_direction",
		value: callGlobal("sanitize_android_direction")
	},
	swipeInDirection: {
		argumentName: "direction",
		newType: "String",
		name: "sanitize_android_direction",
		value: callGlobal("sanitize_android_direction")
	},
	scrollToEdge: {
		argumentName: "edge",
		newType: "String",
		name: "sanitize_android_edge",
		value: callGlobal("sanitize_android_edge")
	}
};

module.exports = generator({
	typeCheckInterfaces,
	contentSanitizersForType: {},
	contentSanitizersForFunction,
	supportedTypes: ["Integer", "int", "double", "String", "boolean"],
	renameTypesMap: {
		int: "Integer", // TODO: add test
		double: "Double"
	},
	classValue: ({ package: pkg, name }) => `${pkg}.${name}`
});
