describe.only('Stressful Use', function() {
  describe('Stress on React Bridge', function() {
    beforeEach(function (done) {
      simulator.reloadReactNativeApp(done);
    });

    it('Should say hello after tap on stressful conditions', function() {
      element(by.label('stressful')).tap()
      expect(element(by.label('Hello World!!!'))).toBeVisible()
    })
  })
  
})
