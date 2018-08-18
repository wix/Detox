const path = require('path');
const glob = require('glob').sync;
const readFile = require('fs').readFileSync;
const { parse } = require('@babel/parser');

const DOCUMENTATION_IDENTIFIER = '@Documented';
const blockComments = (ast) => ast.comments.filter((node) => node.type === 'CommentBlock');

function findDocumentationComment(fileContent) {
  return blockComments(parse(fileContent, { plugins: ["objectRestSpread"]}))
    .map((comment) => comment.value)
    .find((content) => content.includes(DOCUMENTATION_IDENTIFIER));
}

// Returns [path, content]
function findDocumentedFiles(basePath, globPattern) {
  const filepaths = glob(globPattern, {
    cwd: basePath
  });

  return filepaths
    .map((filePath) => [filePath, readFile(path.resolve(basePath, filePath), 'utf-8')])
    .filter(([_, content]) => findDocumentationComment(content));
}

module.exports = { findDocumentedFiles, findDocumentationComment };
