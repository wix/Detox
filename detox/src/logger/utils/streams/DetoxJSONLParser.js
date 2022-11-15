const JsonlParser = require('stream-json/jsonl/Parser');

const { through } = require('./transformers');

class DetoxJSONLParser {
  constructor(logger) {
    this._logger = logger;
  }

  createTransformer() {
    const log = this._logger;
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

    return {
      writable,
      readable: writable.pipe(readable),
    };
  }
}

module.exports = DetoxJSONLParser;
