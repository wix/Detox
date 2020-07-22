async function expectToThrow(testBlock, withMessage) {
  try {
    await testBlock();
    fail('Expected an error but nothing was thrown');
  } catch (e) {
    if (withMessage && !e.message.includes(withMessage)) {
      throw new Error(`Caught an expected error but message was different:\nExpected: ${withMessage}\nReceived: ${e.message}`)
    }
    console.log('Caught an expected error:', e.message.split('\n', 1)[0]);
  }
}

module.exports = {
  expectToThrow,
};
