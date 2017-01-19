describe('Simulator', () => {
  describe('reloadReactNativeApp', () => {
    before((done) => {
      simulator.reloadReactNativeApp(done);
    });
    it('should tap successfully', () => {
      element(by.label('Sanity')).tap();
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

  describe('relaunchApp', () => {
    before((done) => {
      simulator.relaunchApp(done);
    });
    it('should tap successfully', () => {
      element(by.label('Sanity')).tap();
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

  describe('deleteAndRelaunchApp', () => {
    before((done) => {
      simulator.deleteAndRelaunchApp(done);
    });
    it('should tap successfully', () => {
      element(by.label('Sanity')).tap();
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

});
