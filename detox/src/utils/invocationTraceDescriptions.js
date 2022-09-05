module.exports = {
  actionDescription: {
    adjustSliderToPosition: (newPosition) => `adjust slider to position ${newPosition}`,
    clearText: () => 'clear input text',
    getAttributes: () => 'get element attributes',
    longPress: (duration) => `long press${duration !== undefined ? ` for ${duration}ms` : ''}`,
    longPressAndDrag: (duration, startX, startY, targetElement, endX, endY, speed, holdDuration) =>
      `long press and drag from ${startX}, ${startY} to ${endX}, ${endY} with speed ${speed} and hold duration ${holdDuration}`,
    multiTap: (times) => `tap ${times} times`,
    pinch: (scale, speed, angle) => `pinch with scale ${scale}, speed ${speed}, and angle ${angle}`,
    pinchWithAngle: (direction, speed, angle) => `pinch with direction ${direction}, speed ${speed}, and angle ${angle}`,
    replaceText: (value) => `replace input text: "${value}"`,
    scroll: (amount, direction, startPositionX, startPositionY) =>
      `scroll ${amount} pixels ${direction}${startPositionX !== undefined && startPositionY !== undefined ? ` from normalized position (${startPositionX}, ${startPositionY})` : ''}`,
    scrollTo: (edge) => `scroll to ${edge}`,
    scrollToIndex: (index) => `scroll to index #${index}`,
    setColumnToValue: (column, value) => `set column ${column} to value ${value}`,
    setDatePickerDate: (dateString, dateFormat) => `set date picker date to ${dateString} using format ${dateFormat}`,
    swipe: (direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY) =>
      `swipe ${direction} ${speed} with offset ${normalizedSwipeOffset}
      ${!isNaN(normalizedStartingPointX) && !isNaN(normalizedStartingPointY) ? ` from normalized position (${normalizedStartingPointX}, ${normalizedStartingPointY})` : ''}`,
    takeScreenshot: (screenshotName) => `take screenshot${screenshotName !== undefined ? ` with name "${screenshotName}"` : ''}`,
    tapAtPoint: (value) => `tap${value !== undefined ? ` at ${JSON.stringify(value)}` : ''}`,
    tapBackspaceKey: () => 'tap on backspace key',
    tapReturnKey: () => 'tap on return key',
    typeText: (value) => `type input text: "${value}"`,
  },
  expectDescription: {
    waitFor: (actionDescription) => `wait for expectation while ${actionDescription}`,
    waitForWithTimeout: (expectDescription, timeout) => `${expectDescription} with timeout (${timeout} ms)`,
    withTimeout: (timeout) => `wait until timeout (${timeout} ms)`,
    toBeFocused: () => 'to be focused',
    toBeVisible: (percent) => `to be visible${percent !== undefined ? ` ${percent}%` : ''}`,
    toExist: () => 'to exist',
    toHaveText: (text) => `to have text: "${text}"`,
    toHaveLabel: (label) => `to have label: "${label}"`,
    toHaveId: (id) => `to have id: "${id}"`,
    toHaveValue: (value) => `to have value: "${value}"`,
    toHaveSliderPosition: (position, tolerance) => `to have slider position: ${position}${tolerance > 0 ? ` with tolerance ${tolerance}` : ''}`,
    toHaveToggleValue: (value) => `to have toggle value: ${value}`,
    full: (expectDescription, notCondition) => `expect element ${notCondition ? `not ${expectDescription}` : expectDescription}`
  }
};
