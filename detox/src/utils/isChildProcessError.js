function isChildProcessError(error) {
  return "stdout" in error && "stderr" in error && "code" in error;
}

module.exports = isChildProcessError;
