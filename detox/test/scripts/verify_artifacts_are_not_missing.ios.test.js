const verify = require('./verify_artifacts_are_not_missing');

describe('artifacts health check', () => {
  it('should have all the iOS artifacts in ./artifacts folder', verify('ios.sim.release'));
});
