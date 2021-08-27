const path = require('path');

const tempfile = require('tempfile');

module.exports = {
  for: {
    directory: () => tempfile(),
    png: () => tempfile('.detox.png'),
    log: () => tempfile('.detox.log'),
    mp4: () => tempfile('.detox.mp4'),
    dtxrec: () => tempfile('.detox.dtxrec'),
    viewhierarchy: () => tempfile('.detox.viewhierarchy'),
  },
  mask: () => path.join(tempfile(), '..') + path.sep + '*.detox.*',
};
