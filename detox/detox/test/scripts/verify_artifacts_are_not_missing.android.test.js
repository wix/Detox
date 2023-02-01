const verify = require('./verify_artifacts_are_not_missing');

describe('artifacts health check', () => {
  it('should have all the Android artifacts in ./artifacts folder', verify('android.emu.release'));
});
