const _ = require('lodash');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = function verify() {
  let index = 0;
  const subdir = _.last(fs.readdirSync('artifacts'));
  const artifacts = cp.execSync('find .', {
    cwd: path.join('artifacts', subdir),
    encoding: 'utf8'
  }).split('\n').map((filename) => {
    if (filename.endsWith('.startup.log')) {
      return `${++index}.startup.log`;
    }

    return filename;
  }).sort();

  expect(artifacts).toMatchSnapshot();
};
