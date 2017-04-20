var fs = require('fs');
var dir = './e2e';

var mochaOptsContent= '--recursive --timeout 120000 --bail'
var initjsContent = `require('babel-polyfill');
const detox = require('detox');
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config);
});

after(async () => {
  await detox.cleanup();
});`
var firstTestContent = `describe('Example', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should have welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });
  
  it('should show hello screen after tap', async () => {
    await element(by.id('hello_button')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });
  
  it('should show world screen after tap', async () => {
    await element(by.id('world_button')).tap();
    await expect(element(by.label('World!!!'))).toBeVisible();
  });
})`

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    fs.writeFileSync("./e2e/mocha.opts", mochaOptsContent, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
    }); 
    fs.writeFileSync("./e2e/init.js", initjsContent, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
    });
    fs.writeFileSync("./e2e/firstTest.spec.js", firstTestContent, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
    });
} else {
    return console.log('e2e folder already exists')
}
