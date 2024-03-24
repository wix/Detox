const jestExpect = require('@jest/globals').expect;

describe('Drag And Drop', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });

  afterEach(async () => {
  });


  async function performLongPressAndDrag(normalizedPositionX, normalizedPositionY, normalizedTargetPositionX, normalizedTargetPositionY) {
    await element(by.id('draggable')).longPressAndDrag(
      1000,
      normalizedPositionX,
      normalizedPositionY,
      element(by.id('DragAndDropTitle')),
      normalizedTargetPositionX,
      normalizedTargetPositionY,
      'fast',
      0);

    const targetElementAttributes = await element(by.id('DragAndDropTitle')).getAttributes();
    const draggableElementAttributes = await element(by.id('draggable')).getAttributes();


    const expectedTargetX = Math.ceil(targetElementAttributes.frame.x +
      targetElementAttributes.frame.width * normalizedTargetPositionX -
      draggableElementAttributes.frame.width * normalizedPositionX);
    const expectedTargetY = Math.ceil(targetElementAttributes.frame.y +
      targetElementAttributes.frame.height * normalizedTargetPositionY -
      draggableElementAttributes.frame.height * normalizedPositionY);
    const actualX = draggableElementAttributes.frame.x;
    const actualY = draggableElementAttributes.frame.y;

    jestExpect(actualX).toBe(expectedTargetX);
    jestExpect(actualY).toBe(expectedTargetY);
  }

  it('should drag pan from left to left of the title', async () => {
    await performLongPressAndDrag(0, 0, 0, 0);
  });

  it('should drag pan from left to right of the title', async () => {
    await performLongPressAndDrag(0, 0, 1, 0);
  });

  it('should drag pan from right to left of the title', async () => {
    await performLongPressAndDrag(1, 0, 0, 0);
  });

  it('should drag pan from right to right of the title', async () => {
    await performLongPressAndDrag(1, 0, 1, 0);
  });

  it('should drag pan from center to center of the title', async () => {
    await performLongPressAndDrag(0.5, 0.5, 0.5, 0.5);
  });

  it('should drag pan from center to left of the title', async () => {
    await performLongPressAndDrag(0.5, 0.5, 0, 0);
  });

  it('should drag pan from left to center of the title', async () => {
    await performLongPressAndDrag(0, 0, 0.5, 0.5);
  });

});
