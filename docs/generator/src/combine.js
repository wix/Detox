function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
}
function methodToId(method) {
  return method.name + method.args.map((arg) => arg.type + arg.name).join(',');
}

// TODO: strip methods that are undocumented
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
          description: doc.meta.description,
          paths: [path],
          platform: [platform],
          methods: doc.methods.map((method) => ({ ...method, platform: [platform] }))
        }
      ];
    }

    if (!knownRecord.title) {
      knownRecord.title = doc.meta.title;
    } else {
      console.warn('Found two items with the same id, which both expose a title');
    }

    if (!knownRecord.description) {
      knownRecord.description = doc.meta.description;
    } else {
      console.warn('Found two items with the same id, which both expose a description');
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
