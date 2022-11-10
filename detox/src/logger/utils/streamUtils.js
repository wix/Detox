const { PassThrough, Transform } = require('stream');

const bunyanDebugStream = require('bunyan-debug-stream');
const duplexify = require('duplexify');
const fs = require('fs-extra');
const multiSort = require('multi-sort-stream');
const pipe = require('multipipe');
const JsonlParser = require('stream-json/jsonl/Parser');
const stripAnsi = require('strip-ansi');
const { AbstractEventBuilder } = require('trace-event-lib');

const log = require('../../utils/logger').child({ cat: 'logger' });

function compareTimestamps(a, b) {
  return +(a.value.time > b.value.time) - +(a.value.time < b.value.time);
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

function flatMapTransform(fn) {
  let index = 0;

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback){
      const result = fn(chunk, index++);
      if (Array.isArray(result)) {
        // eslint-disable-next-line unicorn/no-array-method-this-argument
        result.forEach(pushThis, this);
      } else if (result) {
        this.push(result);
      }

      callback();
    },
  });
}

function pushThis(x) {
  return this.push(x);
}

function extractValue({ value }) {
  value.msg = stripAnsi(value.msg);

  if (typeof value.time === 'string') {
    value.time = new Date(value.time);
  }

  return value;
}

function through() {
  return new PassThrough({ objectMode: true });
}

function mergeSortedJSONL(jsonlStreams, comparator = compareTimestamps) {
  const intermediate = mapTransform(extractValue);
  const reemitError = (err) => intermediate.emit('error', err);
  const addReemit = (stream) => stream.on('error', reemitError);
  return pipe(multiSort(jsonlStreams.map(addReemit), comparator), intermediate, through());
}

function writeJSONL() {
  return new JsonlStringer({
    header: '',
    delimiter: '\n',
    footer: '',
  });
}

function writeJSON() {
  return new JsonlStringer({
    header: '[\n\t',
    delimiter: ',\n\t',
    footer: '\n]\n',
  });
}

function debugStream(options) {
  const out = new PassThrough({ encoding: 'utf8' });
  const writable = bunyanDebugStream.default({
    ...options,
    colors: false,
    out,
  });

  return duplexify(writable, out, {
    readableObjectMode: false,
    writableObjectMode: true
  });
}

class JsonlStringer extends Transform {
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

const ERROR_TID = 37707;

function getTidHash({ pid, tid, cat }) {
  const mainCategory = String(cat).split(',')[0];
  return `${pid}:${mainCategory}:${tid}`;
}

function getFixedTID(tidHashMap, event) {
  let tid = tidHashMap.get(getTidHash(event));
  if (tid === undefined) {
    tid = ERROR_TID;
  }

  return tid;
}

/**
 * @param {Map<string, number>} [tidHashMap]
 */
function chromeTraceStream(tidHashMap) {
  const knownPids = new Set();
  const knownTids = new Set();
  const fixTID = tidHashMap ? getFixedTID.bind(null, tidHashMap) : (x) => x.tid;

  return flatMapTransform((data) => {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const { cat: rawCat, msg: name, ph = 'i', pid, tid: _tid, time, name: _name, hostname: _hostname, ...args } = data;
    const ts = new Date(time).getTime() * 1E3;
    const cat = rawCat || 'undefined';
    const tid = fixTID(data);

    const builder = new SimpleEventBuilder();
    if (!knownPids.has(pid)) {
      builder.metadata({ pid, ts, name: 'process_name', args: { name: pid === process.pid ? 'primary' : 'secondary' } });
      builder.metadata({ pid, ts, name: 'process_sort_index', args: { sort_index: knownPids.size } });
      knownPids.add(pid);
    }

    if (!knownTids.has(tid)) {
      const primaryCategory = cat.split(',', 1)[0];
      builder.metadata({ pid, tid, ts, name: 'thread_name', args: { name: primaryCategory } });
      builder.metadata({ pid, tid, ts, name: 'thread_sort_index', args: { sort_index: tid } });
      knownTids.add(tid);
    }

    const event = { ph, name, pid, tid, cat, ts, args };
    if (ph === 'E') {
      delete event.name;
    }

    builder.events.push(event);
    return builder.events;
  });
}

// TODO: create PR to https://github.com/mafintosh/duplexify
// should be able to pass { error: false } to end-of-stream
function preventErrorSubscriptions(emitter) {
  const originalOn = emitter.on.bind(emitter);
  emitter.on = (event, ...args) => {
    if (event === 'error') {
      return emitter;
    }

    return originalOn(event, ...args);
  };

  return emitter;
}

function readJSONL() {
  const readable = through();
  const writable = JsonlParser.make({ checkErrors: true })
    .on('error', (err) => {
      if (err instanceof SyntaxError) {
        log.debug({ err });
        readable.end();
      } else {
        readable.emit('error', err);
      }
    });

  return duplexify.obj(preventErrorSubscriptions(writable), writable.pipe(readable));
}

/**
 * @param {string[]} logs
 * @returns {NodeJS.ReadableStream}
 */
function uniteSessionLogs(logs) {
  const readable = through();
  const jsonlStreams = logs.map(filePath => fs.createReadStream(filePath).pipe(readJSONL()));
  mergeSortedJSONL(jsonlStreams).pipe(readable);
  return readable;
}

module.exports = {
  readJSONL,
  writeJSON,
  writeJSONL,
  mergeSortedJSONL,
  debugStream,
  chromeTraceStream,
  uniteSessionLogs,
};
