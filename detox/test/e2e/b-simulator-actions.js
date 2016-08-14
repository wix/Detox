describe('Simulator Actions', function () {

  describe('reloadReactNativeApp', function () {
    before(function (done) {
      simulator.reloadReactNativeApp(done);
    });
    it('should tap successfully', function () {
      element(by.label('SanityScreen')).tap();
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

  describe('relaunchApp', function () {
    before(function (done) {
      simulator.relaunchApp(done);
    });
    it('should tap successfully', function () {
      element(by.label('SanityScreen')).tap();
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

  describe('deleteAndRelaunchApp', function () {
    before(function (done) {
      simulator.deleteAndRelaunchApp(done);
    });
    it('should tap successfully', function () {
      element(by.label('SanityScreen')).tap();
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

});
