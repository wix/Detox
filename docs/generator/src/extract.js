const { findDocumentationComment } = require('./find');
const doctrine = require('doctrine');

const SUPPORTED_PLATFORMS = ['ios', 'android'];

function commentInMethod(methods) {
  return (comment) => methods.some((method) => method.start < comment.start && comment.end < method.end);
}

function byTitle(title) {
  return (tag) => tag.title === title;
}
function not(predicate) {
  return (...args) => !predicate(...args);
}
function getNextMethodName(functions, comment) {
  for (const fn of functions) {
    if (fn.start > comment.end) {
      return fn.key.name;
    }
  }
}

function extractDocumentedMethods(classDef, ast) {
  const methods = classDef.body.body.filter((node) => node.type === 'ClassMethod');
  const comments = ast.comments.filter(
    (comment) => comment.type === 'CommentBlock' && comment.start > classDef.start && comment.end < classDef.end
  );
  const isWithinMethod = commentInMethod(methods);

  const onlyArgs = byTitle('param');
  const onlyExamples = byTitle('example');
  const onlyReturns = byTitle('returns');

  return comments
    .filter(not(isWithinMethod))
    .filter((comment) => getNextMethodName(methods, comment))
    .map((comment) => {
      const docComment = doctrine.parse('/**' + comment.value + '*/', { unwrap: true });
      const methodName = getNextMethodName(methods, comment);

      const args = docComment.tags.filter(onlyArgs).map((arg) => ({
        type: arg.type.name,
        name: arg.name,
        description: arg.description
      }));
      const examples = docComment.tags.filter(onlyExamples).map((arg) => arg.description);
      const returns = docComment.tags.filter(onlyReturns).map((returns) => ({
        description: returns.description,
        type: returns.type.name
      }))[0];

      const isConstructor = methodName === 'constructor';
      return isConstructor
        ? {
            description: docComment.description,
            args,
            examples,
            isConstructor
          }
        : { name: methodName, description: docComment.description, args, examples, returns };
    });
}

function extractMetaInformation(fileContent) {
  const comment = findDocumentationComment(fileContent);
  const attributeRegex = /^.*\*(.*):(.*)$/gm;

  let match = attributeRegex.exec(comment);

  const metaInformation = {};
  while (match !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    metaInformation[key] = value;

    match = attributeRegex.exec(comment);
  }

  if (metaInformation.platform && !SUPPORTED_PLATFORMS.includes(metaInformation.platform)) {
    throw new Error(`Found unexpected Platform ${metaInformation.platform}`);
  }

  // TODO: verify that id is well-formed

  return metaInformation;
}

function extractDocumentation(fileContent) {
  const meta = extractMetaInformation(fileContent);
  const ast = parse(fileContent);
  const classes = ast.program.body.filter((node) => node.type === 'ClassDeclaration');

  // TODO: support more than one class
  const classDef = classes[0];
  const methods = extractDocumentedMethods(classDef, ast);

  return {
    meta,
    methods
  };
}

module.exports = {
  extractDocumentation,
  extractMetaInformation,
  extractDocumentedMethods
};
