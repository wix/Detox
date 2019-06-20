async function expectToThrow(testBlock) {

  let error;
  try {
    await testBlock();
  } catch (e) {
    error = e;
    console.log('Caught an expected error:', e.message.split('\n', 1)[0]);
  }

  if (!error) {
    throw new Error('Expected an error but nothing was thrown');
  }
}

module.exports = {
  expectToThrow,
};
