const _ = require("lodash");
const log = require("npmlog");
const fs = require("fs");
const path = require("path");
const program = require("commander");
const mochaTemplates = require("./templates/mocha");
const jestTemplates = require("./templates/jest");

const PREFIX = "detox-init";

function createFolder(dir, files) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);

    for (const entry of Object.entries(files)) {
      const [filename, content] = entry;
      createFile(path.join(dir, filename), content);
    }
  } else {
    log.error(PREFIX, "%s folder already exists", path.resolve(dir));
  }
}

function createFile(filename, content) {
  try {
    fs.writeFileSync(filename, content);
    log.info(PREFIX, "A file was created in: %s", filename);
  } catch (e) {
    log.error(PREFIX, "Failed to create file in: %s.", filename);
    log.error(PREFIX, e);
  }
}

function main({ runner }) {
  switch (runner) {
    case "mocha":
      return createFolder("e2e", {
        "mocha.opts": mochaTemplates.runnerConfig,
        "init.js": mochaTemplates.initjs,
        "firstTest.spec.js": mochaTemplates.firstTest
      });
    case "jest":
      return createFolder("e2e", {
        "config.json": jestTemplates.runnerConfig,
        "init.js": jestTemplates.initjs,
        "firstTest.spec.js": jestTemplates.firstTest
      });
    default:
      log.error(PREFIX, "unsupported test runner: %s", runner);
      break;
  }
}

program
  .option(
    "-r, --runner [mocha|jest]",
    "Test runner (mocha and jest are supported)",
    "mocha"
  )
  .parse(process.argv);

main(program);
