const { Transform } = require('stream');

class JSONLStringer extends Transform {
  constructor({ replacer, header, delimiter, footer }) {
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

  static serializeJSONL() {
    return new JSONLStringer({
      replacer: undefined,
      header: '',
      delimiter: '\n',
      footer: '',
    });
  }

  static serializeJSON() {
    return new JSONLStringer({
      replacer: undefined,
      header: '[\n\t',
      delimiter: ',\n\t',
      footer: '\n]\n',
    });
  }
}

module.exports = JSONLStringer;
