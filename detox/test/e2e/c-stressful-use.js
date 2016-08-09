const MULTI_TEST_COUNT = 30

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

        it('should have welcome screen', function () {
          expect(element(by.label('Welcome'))).toBeVisible();
          expect(element(by.label('Say Hello'))).toBeVisible();
          expect(element(by.label('Say World'))).toBeVisible();
        });

        it('should show hello screen after tap', function () {
          element(by.label('Say Hello')).tap();
          expect(element(by.label('Hello!!!'))).toBeVisible();
        });

        it('should show world screen after tap', function () {
          element(by.label('Say World')).tap();
          expect(element(by.label('World!!!'))).toBeVisible();
        });
      })
    }
  })

})
