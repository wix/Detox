const JsonlParser = require('stream-json/jsonl/Parser');

const { through } = require('./transformers');

class DetoxJSONLParser {
  constructor(log) {
    this._log = log;
  }

  createTransformer() {
    const log = this._log;
    const readable = through();
    const writable = JsonlParser.make({ checkErrors: true })
      .on('error', (err) => {
        /* istanbul ignore else */
        if (err instanceof SyntaxError) {
          log.debug({ err }, 'Failed to parse log line:');
          readable.end();
        } else {
          readable.emit('error', err);
        }
      });

    return {
      writable,
      readable: writable.pipe(readable),
    };
  }
}

module.exports = DetoxJSONLParser;
