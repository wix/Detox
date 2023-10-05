const { makeResourceTitle, makeResourceSubTitle } = require('./utils');

function makeURLDescription(url, urlCount) {
  return makeResourceSubTitle(`URL #${urlCount}: ${url}`);
}

module.exports = function(properties) {
  let urlCount = 0;
  let urlsDescriptions = [];
  for (const url of properties.urls) {
    urlCount++;
    urlsDescriptions.push(makeURLDescription(url, urlCount));
  }

  return `${makeResourceTitle(`${urlCount} network requests with URLs:`)}\n${urlsDescriptions.join('\n')}`;
};
