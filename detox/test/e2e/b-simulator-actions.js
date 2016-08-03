describe('Simulator Actions', function () {

  describe('reloadReactNativeApp', function () {
    before(function (done) {
      simulator.reloadReactNativeApp(done);
    });
    it('should tap successfully', function () {
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

  describe('relaunchApp', function () {
    before(function (done) {
      this.timeout(20000); // this action for some reason is super slow
      simulator.relaunchApp(done);
    });
    it('should tap successfully', function () {
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

  describe('deleteAndRelaunchApp', function () {
    before(function (done) {
      simulator.deleteAndRelaunchApp(done);
    });
    it('should tap successfully', function () {
      element(by.label('Say Hello')).tap();
      expect(element(by.label('Hello!!!'))).toBeVisible();
    });
  });

});
