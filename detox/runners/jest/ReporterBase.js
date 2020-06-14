class ReporterBase {
  _traceln(message) {
    this._trace(message);
    process.stdout.write('\n');
  }

  _trace(message) {
    process.stdout.write(message);
  }
}

module.exports = ReporterBase;
