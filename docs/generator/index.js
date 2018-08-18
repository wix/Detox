const { findDocumentedFiles } = require('./src/find');
const { extractDocumentation } = require('./src/extract');
const combineDocumentations = require('./src/combine');
const { writeDocumentation } = require('./src/write');

const documentationFiles = findDocumentedFiles('../../detox/src', '**/*.js');
writeDocumentation(combineDocumentations(documentationFiles.map(([path, content]) => [path, extractDocumentation(content)])), (paths) =>
  paths[0].replace('.js', '.md')
);
