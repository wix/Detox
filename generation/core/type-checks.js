const t = require("babel-types");
const template = require("babel-template");
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
const isGreyMatcher = ({ name }) =>
	template(`
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
const isArray = ({ name }) =>
	template(`
if (
  (typeof ARG !== 'object') || 
  (!ARG instanceof Array)
) {
    throw new Error('${name} must be an array, got ' + typeof ARG);
  }
`)({
		ARG: t.identifier(name)
	});

module.exports = {
	isNumber,
	isString,
	isBoolean,
	isPoint,
	isOneOf,
	isGreyMatcher,
	isArray
};
