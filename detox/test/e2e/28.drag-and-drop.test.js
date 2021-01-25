describe('Drag And Drop', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });

  it('should drag the first cell and drop at the seven cell position', async () => {
    await assertCellsOrder([1, 2 ,3 ,4 ,5 ,6 ,7 ,8 ,9, 10])
    // await element(by.id('cellId_0')).longPressAndDrag(2000, 0.5, 0.5, element(by.id('cellId_6')), 0.5, 0.5, 'fast', 2000);
    // await assertCellsOrder([2 ,3 ,4 ,5 ,6 ,7 ,1, 8 ,9, 10])
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