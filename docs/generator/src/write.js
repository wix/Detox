const prettier = require('prettier');
const path = require('path');
const writeFile = require('fs').writeFileSync;

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

async function writeDocumentation(documentations, sourceToDestFn) {
  const config = await prettier.resolveConfig(path.resolve(__dirname));

  return documentations.map((doc) => ({ doc, outputPath: sourceToDestFn(doc.paths) })).map(({ doc, outputPath }) => {
    // Side-effect
    writeFile(outputPath, prettier.format(buildDocumentation(doc), { ...config, parser: 'markdown' }));

    return outputPath;
  });
}

module.exports = {
  writeDocumentation,
  buildDocumentation
};
