function setUniqueProperty(obj, key, value) {
  let index = 0;
  const suffixed = () => index > 0 ? `${key}${index + 1}` : key;

  while (obj.hasOwnProperty(suffixed())) {
    index++;
  }

  obj[suffixed()] = value;
  return obj;
}

module.exports = setUniqueProperty;
