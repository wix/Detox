describe(':ios: Drag And Drop', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });
  
  afterEach(async () => {
    await element(by.id('closeButton')).tap();
  });

  it('should drag the ten cell and drop "on" the second cell position', async () => {
    await assertCellText(2, '2');
    await element(by.id('cell10')).longPressAndDrag(1000, 0.9, NaN, element(by.id('cell2')), 0.9, NaN, 'fast', 0);
    await assertCellText(2, '10');
  });

  it('should drag the second cell and drop before the ten cell position', async () => {
    await assertCellText(9, '9');
    await element(by.id('cell2')).longPressAndDrag(1000, 0.9, NaN, element(by.id('cell10')), 0.9, 0.01, 'slow', 0);
    await assertCellText(10, '10');
    //Because we used 0.001 as the drop Y point, the `cell2` actually landed at cell9, not cell10.
    await assertCellText(9, '2');
  });
  
  async function assertCellText(idx, value) {
    const attribs = await element(by.id('cellTextLabel')).getAttributes();
    const cellStrings = attribs.elements.map(x => x.text);
    
    if(cellStrings[idx - 1] !== value) {
      throw new Error("Failed!");
    }
  }
});