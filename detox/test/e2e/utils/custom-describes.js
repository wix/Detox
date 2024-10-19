const axios = require('axios');
const PromptHandler = require("./PromptHandler");

const describeOrDescribeSkip = process.env.CI === 'true' ? describe.skip : describe;

describeForCopilotEnv = (description, fn) => {
  describeOrDescribeSkip(':ios: Copilot', () => {
    describe(description, () => {
      beforeAll(async () => {
        if (!await checkVpnStatus()) {
          console.warn('Cannot access the LLM service without Wix BO environment. Relying on cached responses only.');
        }

        await copilot.init(new PromptHandler());
      });

      fn();
    });
  });
}

checkVpnStatus = async () => {
  try {
    const response = await axios.get('https://wix.wixanswers.com/_serverless/expert-toolkit/checkVpn');
    return response.data.enabled === true;
  } catch (error) {
    console.error('Error checking VPN status:', error.message);
    return false;
  }
}

module.exports = {
  describeForCopilotEnv,
};
