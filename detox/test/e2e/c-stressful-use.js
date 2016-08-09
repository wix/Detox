describe.only('Stressful Use', function() {
  describe('Stress on React Bridge', function() {
    beforeEach(function (done) {
      simulator.reloadReactNativeApp(done)
    })

    it('Should say hello after tap in conditions of Stressful Bridge', function() {
      element(by.label('Bridge Stress')).tap()
      expect(element(by.label('Hello World!!!'))).toBeVisible()
    })
  })

  describe('Stress on JS Event Loop', function() {
    beforeEach(function (done) {
      simulator.reloadReactNativeApp(done)
    })

    it('Should say hello after tap in conditions of Stressful JS Events Loop', function() {
      element(by.label('Events Stress')).tap()
      expect(element(by.label('Hello World!!!'))).toBeVisible()
    })
  })

})
