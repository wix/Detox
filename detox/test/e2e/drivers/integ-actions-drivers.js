const scrollingTextsDriver = {
  scrollView: () => element(by.id('integActions.textsScrollView')),
  scrollDown: async (amount) => {
    await scrollingTextsDriver.scrollView().scroll(amount + 15.5, 'down'); // Adjustment is experiments-based, not a magic number!
  },
  tapOnText: async (id) => {
    const elementId = scrollingTextsDriver._elementId(id);
    await element(by.id(elementId)).tap();
  },
  assertTextTappedOnce: async (id) => {
    const elementId = scrollingTextsDriver._elementId(id);
    const expectedText = `${elementId}: 1`;
    await expect(element(by.id(elementId))).toHaveText(expectedText);
  },
  _elementId: (fieldId) => `tappableText-${fieldId}`,
};

const scrollingTextInputsDriver = {
  scrollView: () => element(by.id('integActions.inputsScrollView')),
  scrollDown: async (amount) => {
    await scrollingTextInputsDriver.scrollView().scroll(amount + 16, 'down'); // Adjustment is experiments-based, not a magic number!
  },
  typeInField: async (fieldId) => {
    const elementId = scrollingTextInputsDriver._elementId(fieldId);
    const typedText = elementId;
    await element(by.id(elementId)).typeText(typedText);
  },
  assertFieldText: async (fieldId) => {
    const elementId = scrollingTextInputsDriver._elementId(fieldId);
    const expectedText = elementId;
    await expect(element(by.id(elementId))).toHaveText(expectedText);
  },
  _elementId: (fieldId) => `textInput-${fieldId}`,
};

module.exports = {
  scrollingTextInputsDriver,
  scrollingTextsDriver,
};
