const jestExpect = require('@jest/globals').expect;

describe('Drag And Drop', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });

  function expectWithEpsilon(actual, expected, epsilon) {
    jestExpect(actual).toBeGreaterThanOrEqual(expected - epsilon);
    jestExpect(actual).toBeLessThanOrEqual(expected + epsilon);
  }

  async function performLongPressAndDrag(normalizedPositionX, normalizedPositionY, normalizedTargetPositionX, normalizedTargetPositionY) {

    const dragAndDropTargetElement = element(by.id('DragAndDropTarget'));
    const draggableElement = element(by.id('draggable'));

    await draggableElement.longPressAndDrag(
      1000,
      normalizedPositionX,
      normalizedPositionY,
      dragAndDropTargetElement,
      normalizedTargetPositionX,
      normalizedTargetPositionY,
      'fast',
      0);

    const targetElementAttributes = await dragAndDropTargetElement.getAttributes();
    const draggableElementAttributes = await draggableElement.getAttributes();

    const expectedTargetX = Math.ceil(targetElementAttributes.frame.x +
      targetElementAttributes.frame.width * normalizedTargetPositionX -
      draggableElementAttributes.frame.width * normalizedPositionX);
    const expectedTargetY = Math.ceil(targetElementAttributes.frame.y +
      targetElementAttributes.frame.height * normalizedTargetPositionY -
      draggableElementAttributes.frame.height * normalizedPositionY);
    const actualX = draggableElementAttributes.frame.x;
    const actualY = draggableElementAttributes.frame.y;

    expectWithEpsilon(actualX, expectedTargetX, 1);
    expectWithEpsilon(actualY, expectedTargetY, 1);
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
