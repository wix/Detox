const { findDocumentedFiles } = require('./src/find');
const { extractDocumentation } = require('./src/extract');
const combineDocumentations = require('./src/combine');
const { writeDocumentation } = require('./src/write');
const outputMapping = require('./src/outputMapping');

const documentationFiles = findDocumentedFiles('../../detox/src', '**/*.js');
writeDocumentation(
  combineDocumentations(documentationFiles.map(([path, content]) => [path, extractDocumentation(content)])),
  outputMapping("../generated-docs")
);
