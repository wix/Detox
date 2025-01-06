const axios = require('axios');
const PromptHandler = require("./PromptHandler");

describe.skipIfCI = (title, fn) => {
  const isCI = process.env.CI === 'true';
  return isCI ? describe.skip(title, fn) : describe(title, fn);
};

describe.skipIfNewArch = (title, fn) => {
  const isNewArch = process.env.RCT_NEW_ARCH_ENABLED === '1';
  if (isNewArch) {
    console.warn('Skipping tests for new architecture, as there are issues related to the new architecture.');
    return describe.skip(title, fn);
  }
  return describe(title, fn);
};

describe.forCopilot = (description, fn) => {
  return describe.skipIfCI(':ios: Copilot', () => {
    describe(description, () => {
      beforeAll(async () => {
        if (!await _checkVpnStatus()) {
          console.warn('Cannot access the LLM service without Wix BO environment. Relying on cached responses only.');
        }
        try {
          await copilot.init(new PromptHandler());
        } catch (error) {
          if (error.message.includes('Copilot has already been initialized')) {
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
