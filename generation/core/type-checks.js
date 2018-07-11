const t = require('babel-types');
const template = require('babel-template');
const { generateTypeCheck, generateIsOneOfCheck } = require('babel-generate-guard-clauses');

const isNumber = generateTypeCheck('number');
const isString = generateTypeCheck('string');
const isBoolean = generateTypeCheck('boolean');
const isPoint = [
  generateTypeCheck('object'),
  generateTypeCheck('number', { selector: 'x' }),
  generateTypeCheck('number', { selector: 'y' })
];
const isOneOf = generateIsOneOfCheck;
function isGreyMatcher({ name }) {
  return template(`
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
}

function isGreyAction({ name }) {
  return template(`
  if (
    typeof ARG !== "object" || 
    ARG.type !== "Invocation" ||
    typeof ARG.value !== "object" || 
    typeof ARG.value.target !== "object" ||
    ARG.value.target.value !== "GREYActions"
  ) {
    throw new Error('${name} should be a GREYAction, but got ' + JSON.stringify(ARG));
    }
`)({
    ARG: t.identifier(name)
  });
}

function isGreyElementInteraction({ name }) {
  return template(`
  if (
    typeof ARG !== "object"
  ) {
		// TODO: This currently only checks for object, we should add more fine grained checks here
    throw new Error('${name} should be a GREYElementInteraction, but got ' + JSON.stringify(ARG));
  }
`)({
    ARG: t.identifier(name)
  });
}
function isArray({ name }) {
  return template(`
if (
  (typeof ARG !== 'object') || 
  (!ARG instanceof Array)
) {
    throw new Error('${name} must be an array, got ' + typeof ARG);
  }
`)({
    ARG: t.identifier(name)
  });
}

function isOfClass(className) {
  return ({ name }) =>
    template(`
	if (
		typeof ARG !== 'object' ||
		typeof ARG.constructor !== 'function' ||
		ARG.constructor.name.indexOf('${className}') === -1
	) {
		const isObject = typeof ARG === 'object';
		const additionalErrorInfo = isObject ? (typeof ARG.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + ARG.constructor.name +'"') : 'it is no object';

		console.error('${name} should be an instance of ${className}, got "' + ARG + '", it appears that ' + additionalErrorInfo);
	}
	`)({
      ARG: t.identifier(name)
    });
}

function isDefined() {
  return ({ name }) =>
    template(`
	if (!ARG) {
		throw new Error('${name} should be truthy, but it is "' + ARG + '"');
	}
	`)({
      ARG: t.identifier(name)
    });
}

module.exports = {
  isNumber,
  isString,
  isBoolean,
  isPoint,
  isOneOf,
  isGreyAction,
  isGreyMatcher,
  isArray,
  isOfClass,
  isGreyElementInteraction,
  isDefined
};
