const fs = require('fs-extra');
const npmlog = require('npmlog');
const { Tail } = require('tail');
const ensureMove = require('../../../utils/ensureMove');
const RecordingArtifact = require('../../core/artifact/RecordingArtifact');

class SimulatorLogRecording extends RecordingArtifact {
  constructor({
    stdoutPath,
    stderrPath,
    temporaryLogPath,
    fromBeginning,
  }) {
    super();

    this._logPath = temporaryLogPath;
    this._stdoutPath = stdoutPath;
    this._stderrPath = stderrPath;
    this._fromBeginning = fromBeginning;

    this._logStream = null;
    this._stdoutTail = null;
    this._stderrTail = null;
  }

  async doStart() {
    await fs.ensureFile(this._logPath);
    this._logStream = fs.createWriteStream(this._logPath, { flags: 'w' });
    this._stdoutTail = this._createTail(this._stdoutPath, 'stdout');
    this._stderrTail = this._createTail(this._stderrPath, 'stderr');
  }

  async doStop() {
    this._stdoutTail.unwatch();
    this._stderrTail.unwatch();
    this._logStream.end();
  }

  async doSave(artifactPath) {
    await ensureMove(this._logPath, artifactPath, '.log');
  }

  async doDiscard() {
    await fs.remove(this._logPath);
  }

  _createTail(file, prefix) {
    const tail = new Tail(file, {
      fromBeginning: this._fromBeginning,
      logger: {
        info: (...args) => npmlog.verbose(`simulator-log-${prefix}`, ...args),
        error: (...args) => npmlog.error(`simulator-log-${prefix}`, ...args),
      },
    }).on('line', (line) => {
      this._appendLine(prefix, line);
    });

    if (this._fromBeginning) {
      this._triggerTailReadUsingHack(tail);
    }

    return tail;
  }

  /***
   * @link https://github.com/lucagrulla/node-tail/issues/40
   */
  _triggerTailReadUsingHack(tail) {
    tail.watchEvent.call(tail, "change");
  }

  _appendLine(prefix, line) {
    this._logStream.write(prefix);
    this._logStream.write(': ');
    this._logStream.write(line);
    this._logStream.write('\n');
  }
}

module.exports = SimulatorLogRecording;

