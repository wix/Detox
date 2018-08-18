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

function writeDocumentation(documentations, sourceToDestFn) {
  documentations.forEach((doc) => {
    const outputPath = sourceToDestFn(doc.paths);
    writeFile(outputPath, buildDocumentation(doc));
  });
}

module.exports = {
  writeDocumentation,
  buildDocumentation
};
