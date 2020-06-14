function getFullTestName(test, separator = ' ') {
  let testName = '';
  for (let parent = test.parent;
       parent.parent; // Since there's always an unwanted root made up by jest
       parent = parent.parent) {
    testName = parent.name + separator + testName;
  }
  testName += test.name;
  return testName;
}

module.exports = getFullTestName;
