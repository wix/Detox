const path = require('path');
const glob = require('glob').sync;
const readFile = require('fs').readFileSync;
const { parse } = require('@babel/parser');

const DOCUMENTATION_IDENTIFIER = '@Documented';
const blockComments = (ast) => ast.comments.filter((node) => node.type === 'CommentBlock');

function findDocumentationComments(ast) {
  return blockComments(ast).filter((comment) => comment.value.includes(DOCUMENTATION_IDENTIFIER));
}

// Returns [path, content]
function findDocumentedFiles(basePath, globPattern) {
  const filepaths = glob(globPattern, {
    cwd: basePath
  });

  return filepaths
    .map((filePath) => [filePath, parse(readFile(path.resolve(basePath, filePath), 'utf-8'), { plugins: ['objectRestSpread'] })])
    .filter(([_, content]) => findDocumentationComments(content)[0]);
}

function findClassAfterComment(ast, commentAst) {
  if (!ast || !commentAst) {
    throw new Error('ast needs to be set');
  }

  if (!commentAst) {
    throw new Error('comment needs to be set');
  }

  const classAst = ast.program.body.find((node) => node.loc.start.line > commentAst.loc.end.line && node.type === 'ClassDeclaration');

  if (!classAst) {
    throw new Error('Could not find a class after documentation comment');
  }

  return classAst;
}

module.exports = { findDocumentedFiles, findDocumentationComments, findClassAfterComment };
