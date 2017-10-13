function getArgValue(key) {
  process.env[key];
}

module.exports = {
  getArgValue
};
