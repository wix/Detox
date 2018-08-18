function last(array) {
  return array[array.length - 1];
}

function outputMapping(destBase) {
  return (paths) => {
    const [path] = paths;
    const name = last(path.split('/')).replace('.js', '.md');
    return `${destBase}/${name}`;
  };
}

module.exports = outputMapping;
