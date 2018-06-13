const _ = require('lodash');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = function verify() {
  const subdir = _.last(fs.readdirSync('artifacts'));
  const artifacts = cp.execSync('find .', {
    cwd: path.join('artifacts', subdir),
    encoding: 'utf8'
  }).split('\n').map((filename, index) => {
    if (filename.endsWith('.startup.log')) {
      return `${index}.startup.log`;
    }

    return filename;
  });

  expect(artifacts).toMatchSnapshot(process.env.PLATFORM);
};
