function getTimeStampString(date = new Date()) {
  return date.toISOString()
    .replace(/T/, ' ')
    .replace(/\.\d{3}/, '')
    .replace(/:/g, '-');
}

module.exports = getTimeStampString;
