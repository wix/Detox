describe('Drag And Drop', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Drag And Drop')).tap();
  });

  afterEach(async () => {
    //await element(by.id('closeButton')).tap();
  });


  it('should drag pan to left of the title', async () => {
    console.log('attributes: ', await element(by.id('draggable')).getAttributes());
    await element(by.id('draggable')).longPressAndDrag(
      1000,
      0.5,
      0.5,
      element(by.id('DragAndDropTitle')),
      0,
      0,
      'fast',
      0);


    await new Promise(r => setTimeout(r, 2000));
  });

});
