const { VerboseReporter: JestVerboseReporter } = require('@jest/reporters'); // eslint-disable-line node/no-extraneous-require

class DetoxReporter extends JestVerboseReporter {}

module.exports = DetoxReporter;
