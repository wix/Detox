const path = require('path');
const fs = require('fs');
const packageJson = 'package.json';
const detoxRc = '.detoxrc';

class ConfigurationResolver {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }

  getDetoxConfiguration(configPath) {
    if (configPath) {
      return this.loadConfiguration(configPath);
    }

    const { detox } = this.loadConfiguration(packageJson);
    if (detox) {
      return detox;
    }
    return this.loadDetoxrcConfiguration()
  }

  loadDetoxrcConfiguration() {
    var data = fs.readFileSync(this.resolvePath(detoxRc)).toString();
    return JSON.parse(data);  
  }

  resolvePath(suffix) {
    return path.resolve(this.cwd, suffix);
  }

  loadConfiguration(configPath) {
    return require(this.resolvePath(configPath));
  }
}

ConfigurationResolver.default = new ConfigurationResolver();

module.exports = ConfigurationResolver;
