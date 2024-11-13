const { DetoxRuntimeError } = require('../errors');

const { assertPoint, assertDuration, assertUndefined, assertShouldIgnoreStatusBar } = require('./assertArgument');

function mapDeviceLongPressArguments(optionalAllParams, optionalDurationOrIgnoreStatusBar, optionalIgnoreStatusBar) {
    let point = null;
    let duration = null;
    let shouldIgnoreStatusBar = null;

    try {
      if (optionalAllParams === undefined) {
        // Do nothing.
      } else if (typeof optionalAllParams === 'number') {
        duration = optionalAllParams;
        if (typeof optionalDurationOrIgnoreStatusBar === 'boolean') {
            shouldIgnoreStatusBar = optionalDurationOrIgnoreStatusBar;
        } else {
            assertUndefined(optionalDurationOrIgnoreStatusBar);
        }
        assertUndefined(optionalIgnoreStatusBar);
      } else if (typeof optionalAllParams === 'boolean') {
        shouldIgnoreStatusBar = optionalAllParams;
        assertUndefined(optionalDurationOrIgnoreStatusBar);
        assertUndefined(optionalIgnoreStatusBar);
      } else {
        assertPoint(optionalAllParams);
        point = optionalAllParams;

        if (typeof optionalDurationOrIgnoreStatusBar === 'number') {
          assertDuration(optionalDurationOrIgnoreStatusBar);
          duration = optionalDurationOrIgnoreStatusBar;
        } else if (typeof optionalDurationOrIgnoreStatusBar === 'boolean') {
          assertShouldIgnoreStatusBar(optionalDurationOrIgnoreStatusBar);
          shouldIgnoreStatusBar = optionalDurationOrIgnoreStatusBar;
          assertUndefined(optionalIgnoreStatusBar);
        } else if (optionalDurationOrIgnoreStatusBar !== undefined) {
            assertDuration(optionalDurationOrIgnoreStatusBar);
        } else {
          assertUndefined(optionalDurationOrIgnoreStatusBar);
          assertUndefined(optionalIgnoreStatusBar);
        }

        if (optionalIgnoreStatusBar !== undefined) {
          assertShouldIgnoreStatusBar(optionalIgnoreStatusBar);
          shouldIgnoreStatusBar = optionalIgnoreStatusBar;
        }
      }
    } catch (e) {
      throw new DetoxRuntimeError(`longPress accepts either a duration (number) or a point ({x: number, y: number}) as ` +
        `its first argument, optionally a duration (number) as its second argument, and optionally a ignoreStatusBar (boolean) as its third argument. Error: ${e.message}`);
    }

    return { point, duration, shouldIgnoreStatusBar };
  }

module.exports = mapDeviceLongPressArguments;
