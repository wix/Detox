const { Transform } = require('stream');

const multiSort = require('multi-sort-stream');
const JsonlParser = require('stream-json/jsonl/Parser');
const JsonlStringer = require('stream-json/jsonl/Stringer');

const log = require('./logger').child({ __filename });

function compareTimestamps(a, b) {
  return +(a.time > b.time) - +(a.time < b.time);
}

function toJSONLStream(inputStream) {
  const jsonlparser = new JsonlParser();
  const extractor = valueExtractorStream();

  return inputStream
    .on('error', (e) => extractor.emit('error', e))
    .pipe(jsonlparser)
    .on('error', (err) => {
      log.debug({ event: 'JSONL_ERROR', err });
      return extractor.end();
    })
    .pipe(extractor);
}

function mapTransform(fn) {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback){
      this.push(fn(chunk));
      callback();
    },
  });
}

function valueExtractorStream() {
  return mapTransform(entry => entry.value);
}

/**
 * @param {import('stream').Readable[]} inputStreams
 * @return {import('stream').Transform}
 */
function createUnitedJSONLogStream(inputStreams) {
  const jsonlStringer = new JsonlStringer();
  const jsonlStreams = inputStreams.map(toJSONLStream);
  const reemitError = e => jsonlStringer.emit('error', e);

  for (const stream of jsonlStreams) {
    stream.on('error', reemitError);
  }

  return multiSort(jsonlStreams, compareTimestamps)
    .on('error', reemitError)
    .pipe(jsonlStringer);
}

module.exports = createUnitedJSONLogStream;
