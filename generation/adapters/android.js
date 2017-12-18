const t = require("babel-types");
const generator = require("../core/generator");

const { isNumber } = require("../core/type-checks");

const typeCheckInterfaces = {
	Integer: isNumber,
	double: isNumber
};

module.exports = generator({
	typeCheckInterfaces,
	supportedContentSanitizersMap: {},
	supportedTypes: ["Integer", "int", "double"],
	renameTypesMap: {
		int: "Integer" // TODO: add test
	},
	classValue: ({ package: pkg, name }) => `${pkg}.${name}`
});
