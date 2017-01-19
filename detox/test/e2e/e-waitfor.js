describe('WaitFor', () => {
  beforeEach((done) => {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(() => {
    element(by.label('WaitFor')).tap();
  });

  it('should wait until an element exists', () => {
    expect(element(by.id('UniqueId336'))).toNotExist();
    waitFor(element(by.id('UniqueId336'))).toExist().withTimeout(2000);
    expect(element(by.id('UniqueId336'))).toExist();
  });

  it('should wait until an element becomes visible', () => {
    expect(element(by.id('UniqueId521'))).toBeNotVisible();
    waitFor(element(by.id('UniqueId521'))).toBeVisible().withTimeout(2000);
    expect(element(by.id('UniqueId521'))).toBeVisible();
  });

  it('should wait until an element is removed', () => {
    expect(element(by.id('UniqueId085'))).toBeVisible();
    waitFor(element(by.id('UniqueId085'))).toBeNotVisible().withTimeout(2000);
    expect(element(by.id('UniqueId085'))).toBeNotVisible();
  });

  it('should find element by scrolling until it is visible', () => {
    expect(element(by.label('Text5'))).toBeNotVisible();
    waitFor(element(by.label('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
    expect(element(by.label('Text5'))).toBeVisible();
  });

});
