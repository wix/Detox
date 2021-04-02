async function expectToThrow(testBlock, withMessage) {
  let hasFailed = false;

  try {
    await testBlock();
  } catch (e) {
    hasFailed = true;

    if (withMessage && !e.message.includes(withMessage)) {
      throw new Error(`Caught an expected error but message was different:\nExpected: ${withMessage}\nReceived: ${e.message}`)
    } else {
      const [firstLine] = e.message.split('\n', 1);
      console.log('Caught an expected error:', firstLine);
    }
  }

  if (!hasFailed) {
    throw new Error('Expected an error but nothing was thrown');
  }
}

module.exports = {
  expectToThrow,
};
