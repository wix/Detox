const cpp = require('child-process-promise');

const sh = new Proxy({}, {
  get: function(target, prop) {
    if (target[prop] === undefined) {
      return target[prop] = (...params) => {
        return cpp.exec(`${prop} ${params.join(' ')}`);
      };
    } else {
      return target[prop];
    }
  }
});

process.env['PATH'] = `${process.env.PATH}:${sh.npm(`bin`)}`;

module.exports = sh;
