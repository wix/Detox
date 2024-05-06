const { assertPoint, assertDuration } = require('./assertArgument');

function mapLongPressArguments(optionalPointOrDuration, optionalDuration) {
  let point = null;
  let duration = null;

  try {
    if (optionalPointOrDuration !== undefined) {
      assertPoint(optionalPointOrDuration);
      point = optionalPointOrDuration;

      if (optionalDuration !== undefined) {
        assertDuration(optionalDuration);
        duration = optionalDuration;
      }
    } else if (optionalDuration !== undefined) {
      assertDuration(optionalDuration);
      duration = optionalDuration;
    }
  } catch (e) {
    throw new Error(`longPress accepts either a duration (number) or a point ({x: number, y: number}) as ` +
      `its first argument, and optionally a duration (number) as its second argument. Error: ${e.message}`);
  }

  return { point, duration };
}

module.exports = mapLongPressArguments;
