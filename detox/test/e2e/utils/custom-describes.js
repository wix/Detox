const axios = require('axios');
const WixPromptHandler = require("./WixPromptHandler");
const { isRNNewArch } = require('../../../src/utils/rn-consts/rn-consts');

describe.skipIfCI = (title, fn) => {
  const isCI = process.env.CI === 'true';
  return isCI ? describe.skip(title, fn) : describe(title, fn);
};

describe.skipIfNewArchOnIOS = (title, fn) => {
  if (isRNNewArch && device.getPlatform() === 'ios') {
    console.warn('Skipping tests for new architecture, as there are issues related to the new architecture.');
    return describe.skip(title, fn);
  }
  return describe(title, fn);
};

describe.forPilot = (description, fn) => {
  return describe.skipIfCI(':ios: Pilot', () => {
    describe(description, () => {
      beforeAll(async () => {
        if (!await _checkVpnStatus()) {
          console.warn('Cannot access the LLM service without Wix BO environment. Relying on cached responses only.');
        }
        try {
          await pilot.init(new WixPromptHandler());
        } catch (error) {
          if (error.message.includes('Pilot has already been initialized')) {
            // Ignore already initialized error
          } else {
            throw error;
          }
        }
      });

      fn();
    });
  });
};

const _checkVpnStatus = async () => {
  try {
    const response = await axios.get('https://bo.wix.com/_serverless/expert-toolkit/checkVpn');
    return response.data.enabled === true;
  } catch (error) {
    console.error('Error checking VPN status:', error.message);
    return false;
  }
};
