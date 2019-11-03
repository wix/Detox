const path = require('path');
const tempfile = require('tempfile');

module.exports = {
  for: {
    png: () => tempfile('.detox.png'),
    log: () => tempfile('.detox.log'),
    mp4: () => tempfile('.detox.mp4'),
    dtxrec: () => tempfile('.detox.dtxrec'),
  },
  mask: () => path.join(tempfile(), '..') + path.sep + '*.detox.*',
};