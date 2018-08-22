const _ = require('lodash');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = function verify() {
  let startupLogs = 0;
  let textLogs = 0;
  let jsonLogs = 0;

  const subdir = _.last(fs.readdirSync('artifacts'));
  const artifacts = cp.execSync('find .', {
    cwd: path.join('artifacts', subdir),
    encoding: 'utf8'
  }).split('\n').map((filename) => {
    if (filename.endsWith('.startup.log')) {
      return `${++startupLogs}.startup.log`;
    }

    if (filename.match(/detox_pid_\d+.log$/)) {
      return `${++textLogs}.detox.log`;
    }

    if (filename.match(/detox_pid_\d+.json.log$/)) {
      return `${++jsonLogs}.detox.json.log`;
    }

    return filename;
  }).sort();

  expect(artifacts).toMatchSnapshot();
};
