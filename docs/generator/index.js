const mkpath = require('mkpath').sync;

const { findDocumentedFiles } = require('./src/find');
const { extractDocumentation } = require('./src/extract');
const combineDocumentations = require('./src/combine');
const { writeDocumentation } = require('./src/write');
const outputMapping = require('./src/outputMapping');

const OUTPUT_PATH = '../generated-docs';
mkpath(OUTPUT_PATH);

const documentationFiles = findDocumentedFiles('../../detox/src', '**/*.js');
writeDocumentation(
  combineDocumentations(documentationFiles.map(([path, content]) => [path, extractDocumentation(content)])),
  outputMapping(OUTPUT_PATH)
);
