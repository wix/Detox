// This isn't ideal, but native scrolling is never entirely accurate, compared the exact amount we pass in in DP.
// This is an approximation based on experiments (over the current native impl.), AND IS IN NO WAY A MAGIC NUMBER (!!!),
// especially since the inaccuracy is not linear as we assume here.
const SCROLL_ADJ_FACTOR = 1.04;

const scrollingTextsDriver = {
  scrollView: () => element(by.id('integActions.textsScrollView')),
  scrollDown: async (amount) => {
    await scrollingTextsDriver.scrollView().scroll(amount * SCROLL_ADJ_FACTOR, 'down'); // Adjustment is experiments-based, not a magic number!
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
    await scrollingTextInputsDriver.scrollView().scroll(amount * SCROLL_ADJ_FACTOR, 'down');
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
