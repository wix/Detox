let _timestamp = 1000;

function nextTimestamp() {
  const timestamp = _timestamp;
  _timestamp += 100;
  return timestamp;
}

module.exports = nextTimestamp;
