function last(array) {
  return array[array.length - 1];
}

function outputMapping(destBase) {
  return (dcoumentation) => {
    return `${destBase}/${dcoumentation.id}.md`;
  };
}

module.exports = outputMapping;
