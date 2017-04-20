const fs = require('fs');
const program = require('commander');
const mochaTemplates = require('./templates/mocha.js')

const initjsContent = `require('babel-polyfill');
const detox = require('detox');
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config);
});

after(async () => {
  await detox.cleanup();
});`

program
  .option('-r, --runner [runner]', 'Test runner (currently supports mocha)', 'mocha')
  .parse(process.argv);

const createFile = (dir, content) => {
    fs.writeFileSync(dir, content, (err) => {
    if(err) {
        return err;
    }
    console.log(`A file was created in "${dir}" `);
    }); 
}

const dir = './e2e';
const createFolder = (firstTestContent, runnerConfig) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
        createFile("./e2e/mocha.opts", runnerConfig)
        createFile("./e2e/init.js", initjsContent)
        createFile("./e2e/firstTest.spec.js", firstTestContent)
    } else {
        return console.log('e2e folder already exists')
    }
}

switch (program.runner) {
  case 'mocha':
    createFolder(mochaTemplates.firstTest, mochaTemplates.runnerConfig)
    break;
  default:
    createFolder(mochaTemplates.firstTest, mochaTemplates.runnerConfig)
}


