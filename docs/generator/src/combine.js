function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
}
function methodToId(method) {
  return method.name + method.args.map((arg) => arg.type + arg.name).join(',');
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

module.exports = combineDocumentations;
