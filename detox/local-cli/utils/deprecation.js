class DetoxDeprecation {
  constructor({ name, version, repositoryUrl, logger }) {
    this.name = name;
    this.version = version;
    this.repositoryUrl = repositoryUrl;
    this.logger = logger;
    this.hasDeprecationWarnings = false;
  }

  coerse({ name }) {
    return (value) => {
      this.logger.warn(`"${name}" is deprecated and will be removed in ${this.name}@${this.nextVersion}`);
      this.hasDeprecationWarnings = true;
      return value;
    };
  }

  get nextVersion() {
    return `${parseInt(this.version, 10) + 1}.0.0`;
  }

  help() {
    this.logger.warn(`See the Migration Guide to fix deprecation warnings: ${this.migrationGuideUrl}`);
  }

  get migrationGuideUrl() {
    return this.repositoryUrl.replace(/\.git$/, '') + '/blob/master/docs/Guide.Migration.md';
  }

  static init(options) {
    const { name, version, repository: { url }} = require('../../package.json');

    return new DetoxDeprecation({
      name,
      version,
      repositoryUrl: url,
      ...options,
    });
  }
}

module.exports = DetoxDeprecation;
