const getMd5 = async (path) => {
  const md5 = require('crypto-js/md5');
  return await md5(path);
}

module.exports = {
  getMd5
};
