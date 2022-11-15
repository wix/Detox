const fs = require('fs');

const bunyanDebugStream = require('bunyan-debug-stream');
const pipe = require('multipipe');
const multiSort = require('multi-sort-stream');
const { PassThrough } = require('stream');
const stripAnsi = require('strip-ansi');

const DetoxJSONLParser = require('./DetoxJSONLParser')
const { mapTransform, through } = require('./transformers');

class BunyanTransformer {
  /**
   * @param {Detox.Logger} logger
   * @param {Detox.DetoxLoggerConfig} config
   */
  constructor(logger, config) {
    this._loggerConfig = config;
    this._jsonlParser = new DetoxJSONLParser(logger);
  }

  /**
   * @param {string[]} logFilePaths
   */
  uniteSessionLogs(logFilePaths) {
    const intermediate = mapTransform(BunyanTransformer.normalizeBunyanRecord);
    const reemitError = (err) => intermediate.emit('error', err);

    const jsonlStreams = logFilePaths.map(filePath => {
      const { readable, writable } = this._jsonlParser.createTransformer();
      fs.createReadStream(filePath)
        .on('error', reemitError)
        .pipe(writable)
        .on('error', reemitError)

      return readable;
    });

    const multisorted = multiSort(jsonlStreams, BunyanTransformer.compareTimestamps);
    return pipe(multisorted, intermediate, through());
  }

  createPlainTransformer() {
    /** @type {*} */
    const readable = new PassThrough({ encoding: 'utf8', objectMode: false });
    const writable = bunyanDebugStream.default({
      ...this._loggerConfig.options,
      colors: false,
      out: readable,
    })

    writable.on('error', (err) => readable.emit('error', err));
    writable.on('finish', () => readable.end());

    return {
      writable,
      readable,
    };
  }

  static normalizeBunyanRecord(record) {
    const value = record.value;
    value.msg = stripAnsi(value.msg);

    if (typeof value.time === 'string') {
      value.time = new Date(value.time);
    }

    return value;
  }

  static compareTimestamps(a, b) {
    return +(a.value.time > b.value.time) - +(a.value.time < b.value.time);
  }
}

module.exports = BunyanTransformer;
