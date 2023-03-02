describe(':ios: Drag And Drop', () => {
  const cell2 = element(by.id('cell2'));
  const cell4 = element(by.id('cell4'));

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });

  afterEach(async () => {
    await element(by.id('closeButton')).tap();
  });

  it('should drag the ten cell and drop "on" the second cell position', async () => {
    await assertCellText(2, '2');

    await cell4.longPressAndDrag(
      1000,
      0.9,
      NaN,
      cell2,
      0.9,
      NaN,
      'fast',
      0
    );

    await assertCellText(2, '4');
  });

  it('should drag the second cell and drop before the 4th cell position', async () => {
    await assertCellText(3, '3');

    await cell2.longPressAndDrag(
      1000,
      0.9,
      NaN,
      cell4,
      0.9,
      0.01,
      'slow',
      0
    );

    await assertCellText(4, '4');

    // We used `0.001` as the drop Y point, so the `cell2` landed at `cell3`, not `cell4`.
    await assertCellText(3, '2');
  });

  async function assertCellText(idx, value) {
    const attribs = await element(by.id('cellTextLabel')).getAttributes();

    if(attribs.elements[idx - 1].text !== value) {
      throw new Error("Failed!");
    }
  }
});
