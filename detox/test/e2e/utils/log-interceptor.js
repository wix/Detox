class LogInterceptor {
  constructor() {
    this._stderrWrite = null;
    this._stderrData = [];
  }

  startStderr() {
    this._stderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (...args) => {
      const [data] = args;
      this._stderrData.push(data);

      this._stderrWrite(...args);
    };
  }

  get strerrData() {
    return this._stderrData.join('');
  }

  stopAll() {
    if (this._stderrWrite) {
      process.stderr.write = this._stderrWrite;
      this._stderrWrite = null;
    }
  }
}

module.exports = LogInterceptor;
