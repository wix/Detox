const TimelineArtifactPlugin = require('detox/src/artifacts/timeline/TimelineArtifactPlugin');

class StubArtifactPluginsProvider {
  declareArtifactPlugins() {
    return {
      timeline: (api) => new TimelineArtifactPlugin({ api, useFakeTimestamps: true }),
    };
  }
}

module.exports = StubArtifactPluginsProvider;
