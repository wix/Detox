const { PassThrough } = require('stream');

const bunyanDebugStream = require('bunyan-debug-stream');
const multiSort = require('multi-sort-stream');
const JsonlParser = require('stream-json/jsonl/Parser');
const JsonlStringer = require('stream-json/jsonl/Stringer');
const stripAnsi = require('strip-ansi');

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

function extractValue({ value }) {
  value.msg = stripAnsi(value.msg);

  if (typeof value.time === 'string') {
    value.time = new Date(value.time);
  }

  return value;
}

/**
 * @param {import('stream').Readable[]} jsonlStreams
 * @return {import('stream').Transform}
 */
function mergeSorted(jsonlStreams, comparator = compareTimestamps) {
  const outputStream = mapTransform(extractValue);
  jsonlStreams.forEach(passErrorsTo(outputStream));
  return combine(multiSort(jsonlStreams, comparator), outputStream).output;
}

function toStringifiedStream(readableStream) {
  const jsonStringerStream = JsonlStringer.make();
  return combine(readableStream, jsonStringerStream).output;
}

function toDebugStream(outputStream, options) {
  return bunyanDebugStream.default({
    ...options,
    colors: false,
    out: outputStream,
  }).on('error', err => outputStream.emit('error', err));
}

module.exports = {
  toJSONLStream,
  mergeSorted,
  toStringifiedStream,
  toDebugStream,
};
