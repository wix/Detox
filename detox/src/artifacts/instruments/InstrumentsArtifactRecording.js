const Artifact = require('../templates/artifact/Artifact');

class InstrumentsArtifactRecording extends Artifact {
  constructor({ pluginContext, client, userConfig, temporaryRecordingPath }) {
    super();

    this._pluginContext = pluginContext;
    this._client = client;
    this._userConfig = userConfig;
    this.temporaryRecordingPath = temporaryRecordingPath;
  }

  async doStart({ dry = false } = {}) {
    if (dry) {
      return; // nominal start, to preserve state change
    }

    if (!this._isClientConnected()) {
      return;
    }

    const params = {
      recordingPath: this.temporaryRecordingPath
    };
    if (this._userConfig.samplingInterval) {
      params['samplingInterval'] = this.prepareSamplingInterval(this._userConfig.samplingInterval);
    }
    await this._client.startInstrumentsRecording(params);
  }

  prepareSamplingInterval(samplingInterval) {
    return samplingInterval;
  }

  async doStop() {
    if (this._isClientConnected()) {
      await this._client.stopInstrumentsRecording();
    }
  }

  _isClientConnected() {
    const isConnectedToDetoxServer = this._client.isConnected && !this._client.pandingAppCrash;
    const isAppRunning = this._pluginContext.bundleId;

    return Boolean(isConnectedToDetoxServer && isAppRunning);
  }
}

module.exports = InstrumentsArtifactRecording;
