function getArgValue(key) {
  return process.env[key];
}

module.exports = {
  getArgValue
};
