const CustomPathBuilder = require('./detox.pathbuilder');
module.exports = ({ rootDir }) => {
  return new CustomPathBuilder({ rootDir, platform: 'android' });
};
