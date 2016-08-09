const MULTI_TEST_COUNT = 35

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

  describe('Multi Simple Flow Test', function() {
    for (let i = 0; i < MULTI_TEST_COUNT; i++) {
      describe(`#${i}`, function() {
        beforeEach(function (done) {
          simulator.reloadReactNativeApp(done)
        })

        it('should show hello screen after tap', function () {
          element(by.label('Say Hello')).tap();
          expect(element(by.label('Hello!!!'))).toBeVisible();
        });
      })
    }
  })

})
