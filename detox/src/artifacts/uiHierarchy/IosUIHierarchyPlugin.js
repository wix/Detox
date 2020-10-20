const _ = require('lodash');
const Client = require('../../client/Client');
const ArtifactPlugin = require('../templates/plugin/ArtifactPlugin');
const FileArtifact = require('../templates/artifact/FileArtifact');
const setUniqueProperty = require('../../utils/setUniqueProperty');

class IosUIHierarchyPlugin extends ArtifactPlugin {
  /**
   * @param {ArtifactsApi} api
   * @param {Client} client
   */
  constructor({ api, client }) {
    super({ api });

    this._pendingDeletions = [];
    this._artifacts = {
      perTest: {},
      perSession: {},
    };

    client.setEventCallback('testFailed', this._onInvokeFailure.bind(this));
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);

    if (!this.enabled && !event.launchArgs.hasOwnProperty('detoxDisableHierarchyDump')) {
      event.launchArgs['detoxDisableHierarchyDump'] = 'YES';
    }
  }

  async onCreateExternalArtifact(e) {
    if (!e.artifact) {
      throw new Error('Internal error: expected Artifact instance in the event');
    }

    this._registerSnapshot(e.name, e.artifact);
  }

  _onInvokeFailure({ params: { viewHierarchyURL } }) {
    if (!viewHierarchyURL) {
      return;
    }

    this._registerSnapshot('ui', new FileArtifact({
      temporaryPath: viewHierarchyURL,
    }));
  }

  _registerSnapshot(name, artifact) {
    if (this.enabled) {
      const scope = this.context.testSummary ? 'perTest' : 'perSession';
      setUniqueProperty(this._artifacts[scope], name, artifact);
    } else {
      this._pendingDeletions.push(artifact.discard());
    }
  }

  async onTestStart(testSummary) {
    this.context.testSummary = null;
    await this._flushArtifacts();
    await super.onTestStart(testSummary);
  }

  async onTestDone(testSummary) {
    await super.onTestDone(testSummary);
    await this._flushArtifacts(testSummary);

    this.context.testSummary = null;
    await this._flushArtifacts();
  }

  async onBeforeCleanup() {
    await this._flushArtifacts();
    await super.onBeforeCleanup();
  }

  async _flushArtifacts(testSummary) {
    const scope = testSummary ? 'perTest' : 'perSession';
    const artifacts = this._artifacts[scope];
    const pendingSaves = _(artifacts)
      .pickBy(_.identity)
      .entries()
      .map(async ([key, artifact]) => {
        const destination = await this.api.preparePathForArtifact(`${key}.viewhierarchy`, testSummary);
        await artifact.save(destination);
      })
      .value();

    const pendingDeletions = this._pendingDeletions.splice(0);
    this._artifacts[scope] = _.mapValues(artifacts, _.constant(null));

    await Promise.all([...pendingSaves, ...pendingDeletions ]);
  }

  /** @param {string} config */
  static parseConfig(config) {
    return {
      enabled: config === 'enabled',
      keepOnlyFailedTestsArtifacts: false,
    };
  }
}

module.exports = IosUIHierarchyPlugin;
