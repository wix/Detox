function isArrowFunction(code) {
  if (!code.includes('=>')) {
    return false;
  }

  const syncCode = removeAsync(code.trimStart());
  return syncCode.startsWith('(') || isSimpleArrowFunction(code);
}

function removeAsync(code) {
  return code.startsWith('async') ? code.slice(5).trimStart() : code;
}

function isSimpleArrowFunction(code) {
  const [signature] = code.split('=>', 1);

  return isAlphanumericId(removeAsync(signature.trim()));
}

function isAlphanumericId(code) {
  return /^[a-zA-Z0-9]+$/.test(code);
}

module.exports = isArrowFunction;
