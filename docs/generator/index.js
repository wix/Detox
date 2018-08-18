const glob = require('glob').sync;
const readFile = require('fs').readFileSync;
const { parse } = require('@babel/parser');
const doctrine = require('doctrine');

// Configuration Globals
const DOCUMENTATION_IDENTIFIER = '@Documented';
const SUPPORTED_PLATFORMS = ['ios', 'android'];

// Filters

const blockComments = (ast) => ast.comments.filter((node) => node.type === 'CommentBlock');

function findDocumentationComment(fileContent) {
  return blockComments(parse(fileContent))
    .map((comment) => comment.value)
    .find((content) => content.includes(DOCUMENTATION_IDENTIFIER));
}

// Returns [path, content]
function findDocumentedFiles(basePath, globPattern) {
  const filepaths = glob(globPattern, {
    cwd: basePath
  });

  return filepaths.map((filePath) => [filePath, readFile(filePath, 'utf-8')]).filter(([_, content]) => findDocumentationComment(content));
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

function not(predicate) {
  return (...args) => !predicate(...args);
}
function commentInMethod(methods) {
  return (comment) => methods.some((method) => method.start < comment.start && comment.end < method.end);
}

function getNextMethodName(functions, comment) {
  for (const fn of functions) {
    if (fn.start > comment.end) {
      return fn.key.name;
    }
  }
}

function byTitle(title) {
  return (tag) => tag.title === title;
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

function methodToId(method) {
  return method.name + method.args.map((arg) => arg.type + arg.name).join(',');
}

function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
}

function combineDocumentations(documentations) {
  const documentationsWithPath = documentations.map(([path, doc]) => ({ ...doc, path }));

  return documentationsWithPath.reduce((carry, doc) => {
    const platform = doc.meta.platform;
    const path = doc.path;

    // Check if it is unknown
    const knownRecord = carry.find((knownDoc) => knownDoc.id === doc.meta.id);
    if (!knownRecord) {
      return [
        ...carry,
        {
          id: doc.meta.id,
          title: doc.meta.title,
          paths: [path],
          platform: [platform],
          methods: doc.methods.map((method) => ({ ...method, platform: [platform] }))
        }
      ];
    }

    // Add new supported platform
    knownRecord.platform = unique([...knownRecord.platform, platform]);
    knownRecord.paths.push(path);

    // Enhance methods
    const newMethods = [];
    doc.methods.forEach((method) => {
      const matchingMethod = knownRecord.methods.find((knownMethod) => methodToId(knownMethod) === methodToId(method));
      if (matchingMethod) {
        matchingMethod.platform = unique([...matchingMethod.platform, platform]);
      } else {
        method.platform = [platform];
        newMethods.push(method);
      }
    });
    knownRecord.methods = knownRecord.methods.concat(newMethods);

    return carry;
  }, []);
}

function buildMethodDocumentation(method) {
  return `
## ${method.name}

${method.description}

${(method.examples || []).map((example) => '- `' + example + '`').join('\n')}
`;
}

function buildDocumentation(documentation) {
  const constructor = documentation.methods.find((method) => method.isConstructor);
  const classDescription = constructor ? constructor.description : '';

  return `---
id: ${documentation.id}
${documentation.title ? 'title: ' + documentation.title : ''}
---

${classDescription}

${documentation.methods.map(buildMethodDocumentation)}
`;
}

function writeDocumentation(documentations, sourceToDestFn) {
  // TODO: implement
}

// const documentationFiles = findDocumentedFiles('../../detox/src', '**/*.js');
// writeDocumentation(
//   combineDocumentations(documentationFiles.map(([path, content]) => [path, extractDocumentation(content)])),
//   (paths) => './foo' // TODO: implement
// );

// Export for testing
module.exports = {
  findDocumentedFiles,
  extractDocumentation,
  combineDocumentations,
  writeDocumentation,
  extractMetaInformation,
  extractDocumentedMethods,
  buildDocumentation
};
