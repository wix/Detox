const loggedErrors = new WeakSet();

function markErrorAsLogged(error) {
  loggedErrors.add(error);
  return error;
}

function isErrorAlreadyLogged(error) {
  return loggedErrors.has(error);
}

module.exports = {
  markErrorAsLogged,
  isErrorAlreadyLogged,
};
