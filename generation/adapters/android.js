const t = require("babel-types");
const generator = require("../core/generator");
const { callGlobal } = require("../helpers");

const {
	isNumber,
	isString,
	isBoolean,
	isOfClass
} = require("../core/type-checks");

const typeCheckInterfaces = {
	Integer: isNumber,
	Double: isNumber,
	String: isString,
	boolean: isBoolean,
	"Matcher<View>": isOfClass("Matcher")
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
	},
	"Matcher<View>": {
		type: "String",
		name: "sanitize_matcher",
		value: callGlobal("sanitize_matcher")
	}
};

const contentSanitizersForType = {
	"Matcher<View>": {
		type: "Invocation",
		name: "sanitize_matcher",
		value: callGlobal("sanitize_matcher")
	}
};

module.exports = generator({
	typeCheckInterfaces,
	contentSanitizersForFunction,
	contentSanitizersForType,
	supportedTypes: [
		"Integer",
		"int",
		"double",
		"Double",
		"boolean",
		"String",
		"Matcher<View>"
	],
	renameTypesMap: {
		int: "Integer", // TODO: add test
		double: "Double"
	},
	classValue: ({ package: pkg, name }) => `${pkg}.${name}`
});
