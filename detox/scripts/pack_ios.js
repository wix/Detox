const {sh} = require('./utils');

function packageIosSources() {
  console.log("\nPackaging Detox iOS sources");

  fs.removeSync('Detox-ios-src.tbz');

  // Prepare Earl Grey without building
  sh("ios/EarlGrey/Scripts/setup-earlgrey.sh");
  sh("find ./ios -name Build -type d -exec rm -rf {} ;");

  sh("tar --exclude-from=.tbzignore -cjf ../Detox-ios-src.tbz .", { cwd: "ios" });
}

module.exports = {
  packageIosSources,
};
