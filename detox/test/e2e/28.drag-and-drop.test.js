describe('Drag And Drop', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });

  it('should drag the first cell and drop at the seven cell position', async () => {
    await assertCellsOrder([1, 2 ,3 ,4 ,5 ,6 ,7 ,8 ,9, 10])
    await element(by.id('cellId_0')).longPressAndDrag(2000, 0.9, NaN, by.id('cellId_6'), 0.9, NaN, 'fast', 0);
    await assertCellsOrder([2 ,3 ,4 ,5 ,6 ,7 ,1, 8 ,9, 10])
  });

  it('should drag the second cell and drop before the seven cell position', async () => {
    await assertCellsOrder([1, 2 ,3 ,4 ,5 ,6 ,7 ,8 ,9, 10])
    await element(by.id('cellId_1')).longPressAndDrag(2000, NaN, NaN, by.id('cellId_6'), NaN, 0.01, 'fast', 0);
    await assertCellsOrder([1 ,3 ,4 ,5 ,6 ,2, 7, 8 ,9, 10])
  });

  async function assertCellsOrder(order) {
    let text = `Cells order: `
    for (let i = 0; i < order.length; i++) {
      if (i > 0) {
        text += ', '
      }
      text += `${order[i]}`
    }
    await expect(element(by.id('cellsOrderId'))).toHaveText(text);
  }
});