const mkpath = require('mkpath').sync;
const rimraf = require('rimraf').sync;
const { findDocumentedFiles } = require('./src/find');
const { extractDocumentation } = require('./src/extract');
const combineDocumentations = require('./src/combine');
const { writeDocumentation } = require('./src/write');
const outputMapping = require('./src/outputMapping');

const OUTPUT_PATH = '../generated-docs';
rimraf(OUTPUT_PATH);
mkpath(OUTPUT_PATH);

const documentationFiles = findDocumentedFiles('../../detox/src', '**/*.js');
const combinedDocumentations = combineDocumentations(
  documentationFiles.reduce((allDocs, [path, ast]) => allDocs.concat(extractDocumentation(ast).map((doc) => [path, doc])), [])
);

console.log(combinedDocumentations[0].methods);

writeDocumentation(combinedDocumentations, outputMapping(OUTPUT_PATH));
