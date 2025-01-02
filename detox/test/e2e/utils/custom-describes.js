const axios = require('axios');
const PromptHandler = require("./PromptHandler");

describeForCopilotEnv = (description, fn) => {
  const isCI = process.env.CI === 'true';
  const describeOrDescribeSkipIfCI = isCI ? describe.skip : describe;

  describeOrDescribeSkipIfCI(':ios: Copilot', () => {
    describe(description, () => {
      beforeAll(async () => {
        if (!await _checkVpnStatus()) {
          console.warn('Cannot access the LLM service without Wix BO environment. Relying on cached responses only.');
        }
        try {
          await copilot.init(new PromptHandler());
        } catch (error) {
          if (error.message.includes('Copilot has already been initialized')) {
          } else {
            throw error;
          }
        }
      });

      fn();
    });
  });
};

_checkVpnStatus = async () => {
  try {
    const response = await axios.get('https://bo.wix.com/_serverless/expert-toolkit/checkVpn');
    return response.data.enabled === true;
  } catch (error) {
    console.error('Error checking VPN status:', error.message);
    return false;
  }
};

describeNewArchNotSupported = (description, fn) => {
  const isNewArch = process.env.RCT_NEW_ARCH_ENABLED === '1';
  const describeOrDescribeSkipIfNewArch = isNewArch ? describe.skip : describe;

  if (isNewArch) {
    console.warn('Skipping tests for new architecture, as there are issues related to the new architecture.');
  }

  describeOrDescribeSkipIfNewArch('Legacy Arch (Paper)', () => {
    describe(description, () => {
      fn();
    });
  });
}

module.exports = {
  describeForCopilotEnv,
  describeNewArchNotSupported
};
