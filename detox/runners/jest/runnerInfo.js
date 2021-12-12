const isJasmine = !!global.jasmine;
const isJestCircus = !!global.detoxCircus;

module.exports = {
  type: isJestCircus ? 'jest-circus' : 'jasmine',
  isJasmine,
  isJestCircus,
};
