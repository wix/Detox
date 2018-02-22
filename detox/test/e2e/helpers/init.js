const detox = require('detox');
const config = require('../../package.json').detox;
jest.setTimeout(480000);


beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
})
//
// let testID;
//
// beforeEach(async () => {
//   // DeviceManager.lock
//   // await detox.beforeEach(this.currentTest.parent.title, this.currentTest.title);
//
//   testID = Math.floor(Math.random() * 100);
//   detox.lock(testID);
//
//   console.log('DDDDDDD BEFORE EZCG GLOBAL')
// });
//
// afterEach(async () => {
//   detox.release(testID);
//   console.log('DDDDDDD AFTER EZCG GLOBAL')
// });
