const { PassThrough } = require('stream');

const multiSort = require('multi-sort-stream');
const JsonlParser = require('stream-json/jsonl/Parser');
const JsonlStringer = require('stream-json/jsonl/Stringer');

const log = require('./logger').child({ __filename });
const { combine, passErrorsTo, mapTransform } = require('./streamUtils');

function compareTimestamps(a, b) {
  return +(a.value.time > b.value.time) - +(a.value.time < b.value.time);
}

function jsonlSafeParseStream() {
  const output = new PassThrough({ objectMode: true });
  const input = JsonlParser.make({ checkErrors: true });

  input
    .on('error', (err) => {
      if (err instanceof SyntaxError) {
        log.debug({ event: 'JSONL_ERROR', err });
        output.end();
      } else {
        output.emit('error', err);
      }
    })
    .pipe(output);

  return { input, output };
}

function toJSONLStream(input) {
  const safeStream = jsonlSafeParseStream();
  combine(input, safeStream.input);
  return safeStream.output;
}

function extractValue(entry) {
  return entry.value;
}

/**
 * @param {import('stream').Readable[]} jsonlStreams
 * @return {import('stream').Transform}
 */
function mergeSorted(jsonlStreams, comparator = compareTimestamps) {
  const outputStream = new PassThrough({ objectMode: true });
  jsonlStreams.forEach(passErrorsTo(outputStream));
  return combine(multiSort(jsonlStreams, comparator), outputStream).output;
}

function toStringifiedStream(readableStream) {
  const extractorStream = mapTransform(extractValue);
  const jsonStringerStream = JsonlStringer.make();

  return combine(combine(readableStream, extractorStream).output, jsonStringerStream).output;
}

module.exports = {
  toJSONLStream,
  mergeSorted,
  toStringifiedStream,
};
