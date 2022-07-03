const { PassThrough, Transform } = require('stream');

const bunyanDebugStream = require('bunyan-debug-stream');
const multiSort = require('multi-sort-stream');
const JsonlParser = require('stream-json/jsonl/Parser');
const stripAnsi = require('strip-ansi');
const { AbstractEventBuilder } = require('trace-event-lib');

const DetoxTracer = require('../logger/DetoxTracer');

const log = require('./logger').child({ __filename });
const { combine, passErrorsTo, flatMapTransform, mapTransform } = require('./streamUtils');

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

function toStringifiedStream(readableStream, kind = 'default') {
  const jsonStringerStream = JsonlStringer[kind]();
  return combine(readableStream, jsonStringerStream).output;
}

function toDebugStream(outputStream, options) {
  return bunyanDebugStream.default({
    ...options,
    colors: false,
    out: outputStream,
  }).on('error', err => outputStream.emit('error', err));
}

class JsonlStringer extends Transform {
  static default() {
    return new JsonlStringer();
  }

  static single() {
    return new JsonlStringer({
      header: '[\n\t',
      delimiter: ',\n\t',
      footer: '\n]\n',
    });
  }

  constructor({ replacer = undefined, header = '', delimiter = '\n', footer = '' } = {}) {
    super({ writableObjectMode: true, readableObjectMode: false });

    this._replacer = replacer;
    this._header = header;
    this._delimiter = delimiter;
    this._footer = footer;
  }

  _transform(chunk, _, callback) {
    if (this._header) {
      this.push(this._header);
    }

    this.push(JSON.stringify(chunk, this._replacer));
    this._transform = this._nextTransform;
    callback(null);
  }

  _nextTransform(chunk, _, callback) {
    this.push(this._delimiter + JSON.stringify(chunk, this._replacer));
    callback(null);
  }

  _flush(callback) {
    if (this._footer) {
      this.push(this._footer);
    }

    callback();
  }
}

class SimpleEventBuilder extends AbstractEventBuilder {
  events = [];
  send(event) {
    this.events.push(event);
  }
}

function foo() {
  const knownPids = new Set();
  const knownTids = new Set();

  return flatMapTransform((data) => {
    const { pid, trace, msg, time, name: _name, hostname: _hostname, ...args } = data;
    const tid = trace ? trace.tid : 9999;
    const ts = new Date(time).getTime() * 1E3;

    const builder = new SimpleEventBuilder();
    if (!knownPids.has(pid)) {
      builder.process_name(pid === process.pid ? 'primary' : 'secondary', pid);
      knownPids.add(pid);
    }

    const tidHash = `${pid}:${tid}`;
    if (!knownTids.has(tidHash)) {
      builder.thread_name(DetoxTracer.categorize(tid), tid, pid);
      knownTids.add(tidHash);
    }

    const event = { ph: 'i', ...data.trace, pid, tid, ts, args };
    if (!trace || trace.ph !== 'E') {
      event.name = msg || '';
    }

    builder.events.push(event);
    return builder.events;
  });
}

module.exports = {
  toJSONLStream,
  mergeSorted,
  toStringifiedStream,
  toDebugStream,
  foo,
};
