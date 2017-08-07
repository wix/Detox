/**

	This code is generated.
	For more information see generation/README.md.
*/


// Globally declared helpers

function sanitize_greyDirection(action) {
  switch (action) {
    case "left":
      return 1;
    case "right":
      return 2;
    case "up":
      return 3;
    case "down":
      return 4;
      
    default:
      throw new Error(`GREYAction.GREYDirection must be a 'left'/'right'/'up'/'down', got ${action}`);
  }
}


class GREYActions {
  /*@return A GREYAction that performs multiple taps of a specified @c count.
*/static actionForMultipleTapsWithCount(count) {
    if (typeof count !== "number") throw new Error("count should be a number, but got " + (count + (" (" + (typeof count + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForMultipleTapsWithCount:",
      args: [{
        type: "NSInteger",
        value: count
      }]
    };
  }

  /*@return A GREYAction that performs multiple taps of a specified @c count at a specified
@c point.
*/static actionForMultipleTapsWithCountAtPoint(count, point) {
    if (typeof count !== "number") throw new Error("count should be a number, but got " + (count + (" (" + (typeof count + ")"))));
    if (typeof point !== "object") throw new Error("point should be a object, but got " + (point + (" (" + (typeof point + ")"))));
    if (typeof point.x !== "number") throw new Error("point.x should be a number, but got " + (point.x + (" (" + (typeof point.x + ")"))));
    if (typeof point.y !== "number") throw new Error("point.y should be a number, but got " + (point.y + (" (" + (typeof point.y + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForMultipleTapsWithCount:atPoint:",
      args: [{
        type: "NSInteger",
        value: count
      }, {
        type: "CGPoint",
        value: point
      }]
    };
  }

  /*Returns an action that holds down finger for 1.0 second (@c kGREYLongPressDefaultDuration) to
simulate a long press.

@return A GREYAction that performs a long press on an element.
*/static actionForLongPress() {
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForLongPress",
      args: []
    };
  }

  /*Returns an action that holds down finger for specified @c duration to simulate a long press.

@param duration The duration of the long press.

@return A GREYAction that performs a long press on an element.
*/static actionForLongPressWithDuration(duration) {
    if (typeof duration !== "number") throw new Error("duration should be a number, but got " + (duration + (" (" + (typeof duration + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForLongPressWithDuration:",
      args: [{
        type: "CFTimeInterval",
        value: duration
      }]
    };
  }

  /*Returns an action that holds down finger for specified @c duration at the specified @c point
(interpreted as being relative to the element) to simulate a long press.

@param point    The point that should be tapped.
@param duration The duration of the long press.

@return A GREYAction that performs a long press on an element.
*/static actionForLongPressAtPointDuration(point, duration) {
    if (typeof point !== "object") throw new Error("point should be a object, but got " + (point + (" (" + (typeof point + ")"))));
    if (typeof point.x !== "number") throw new Error("point.x should be a number, but got " + (point.x + (" (" + (typeof point.x + ")"))));
    if (typeof point.y !== "number") throw new Error("point.y should be a number, but got " + (point.y + (" (" + (typeof point.y + ")"))));
    if (typeof duration !== "number") throw new Error("duration should be a number, but got " + (duration + (" (" + (typeof duration + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForLongPressAtPoint:duration:",
      args: [{
        type: "CGPoint",
        value: point
      }, {
        type: "CFTimeInterval",
        value: duration
      }]
    };
  }

  /*Returns an action that scrolls a @c UIScrollView by @c amount (in points) in the specified
@c direction.

@param direction The direction of the swipe.
@param amount    The amount of points in CGPoints to scroll.

@return A GREYAction that scrolls a scroll view in a given @c direction for a given @c amount.
*/static actionForScrollInDirectionAmount(direction, amount) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof amount !== "number") throw new Error("amount should be a number, but got " + (amount + (" (" + (typeof amount + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForScrollInDirection:amount:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "CGFloat",
        value: amount
      }]
    };
  }

  /*Returns a scroll action that scrolls in a @c direction for an @c amount of points starting from
the given start point specified as percentages. @c xOriginStartPercentage is the x start
position as a percentage of the total width of the scrollable visible area,
@c yOriginStartPercentage is the y start position as a percentage of the total height of the
scrollable visible area. @c xOriginStartPercentage and @c yOriginStartPercentage must be between
0 and 1, exclusive.

@param direction              The direction of the scroll.
@param amount                 The amount scroll in points to inject.
@param xOriginStartPercentage X coordinate of the start point specified as a percentage (0, 1)
exclusive, of the total width of the scrollable visible area.
@param yOriginStartPercentage Y coordinate of the start point specified as a percentage (0, 1)
exclusive, of the total height of the scrollable visible area.

@return A GREYAction that scrolls a scroll view in a given @c direction for a given @c amount
starting from the given start points.
*/static actionForScrollInDirectionAmountXOriginStartPercentageYOriginStartPercentage(direction, amount, xOriginStartPercentage, yOriginStartPercentage) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof amount !== "number") throw new Error("amount should be a number, but got " + (amount + (" (" + (typeof amount + ")"))));
    if (typeof xOriginStartPercentage !== "number") throw new Error("xOriginStartPercentage should be a number, but got " + (xOriginStartPercentage + (" (" + (typeof xOriginStartPercentage + ")"))));
    if (typeof yOriginStartPercentage !== "number") throw new Error("yOriginStartPercentage should be a number, but got " + (yOriginStartPercentage + (" (" + (typeof yOriginStartPercentage + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForScrollInDirection:amount:xOriginStartPercentage:yOriginStartPercentage:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "CGFloat",
        value: amount
      }, {
        type: "CGFloat",
        value: xOriginStartPercentage
      }, {
        type: "CGFloat",
        value: yOriginStartPercentage
      }]
    };
  }

  /*@return A GREYAction that scrolls to the given content @c edge of a scroll view.
*/static actionForScrollToContentEdge(edge) {
    if (!["left", "right", "top", "bottom"].some(option => option === edge)) throw new Error("edge should be one of [left, right, top, bottom], but got " + edge);
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForScrollToContentEdge:",
      args: [{
        type: "GREYContentEdge",
        value: edge
      }]
    };
  }

  /*A GREYAction that scrolls to the given content @c edge of a scroll view with the scroll action
starting from the given start point specified as percentages. @c xOriginStartPercentage is the x
start position as a percentage of the total width of the scrollable visible area,
@c yOriginStartPercentage is the y start position as a percentage of the total height of the
scrollable visible area. @c xOriginStartPercentage and @c yOriginStartPercentage must be between
0 and 1, exclusive.

@param edge                   The edge towards which the scrolling is to take place.
@param xOriginStartPercentage X coordinate of the start point specified as a percentage (0, 1)
exclusive, of the total width of the scrollable visible area.
@param yOriginStartPercentage Y coordinate of the start point specified as a percentage (0, 1)
exclusive, of the total height of the scrollable visible area.

@return A GREYAction that scrolls to the given content @c edge of a scroll view with the scroll
action starting from the given start point.
*/static actionForScrollToContentEdgeXOriginStartPercentageYOriginStartPercentage(edge, xOriginStartPercentage, yOriginStartPercentage) {
    if (!["left", "right", "top", "bottom"].some(option => option === edge)) throw new Error("edge should be one of [left, right, top, bottom], but got " + edge);
    if (typeof xOriginStartPercentage !== "number") throw new Error("xOriginStartPercentage should be a number, but got " + (xOriginStartPercentage + (" (" + (typeof xOriginStartPercentage + ")"))));
    if (typeof yOriginStartPercentage !== "number") throw new Error("yOriginStartPercentage should be a number, but got " + (yOriginStartPercentage + (" (" + (typeof yOriginStartPercentage + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForScrollToContentEdge:xOriginStartPercentage:yOriginStartPercentage:",
      args: [{
        type: "GREYContentEdge",
        value: edge
      }, {
        type: "CGFloat",
        value: xOriginStartPercentage
      }, {
        type: "CGFloat",
        value: yOriginStartPercentage
      }]
    };
  }

  /*Returns an action that fast swipes through the view. The start point of the swipe is chosen to
achieve the maximum the swipe possible to the other edge.

@param direction The direction of the swipe.

@return A GREYAction that performs a fast swipe in the given direction.
*/static actionForSwipeFastInDirection(direction) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSwipeFastInDirection:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }]
    };
  }

  /*Returns an action that slow swipes through the view. The start point of the swipe is chosen to
achieve maximum the swipe possible to the other edge.

@param direction The direction of the swipe.

@return A GREYAction that performs a slow swipe in the given direction.
*/static actionForSwipeSlowInDirection(direction) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSwipeSlowInDirection:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }]
    };
  }

  /*Returns an action that swipes through the view quickly in the given @c direction from a specific
origin.

@param direction              The direction of the swipe.
@param xOriginStartPercentage the x start position as a percentage of the total width
of the view. This must be between 0 and 1.
@param yOriginStartPercentage the y start position as a percentage of the total height
of the view. This must be between 0 and 1.

@return A GREYAction that performs a fast swipe through a view in a specific direction from
the specified point.
*/static actionForSwipeFastInDirectionXOriginStartPercentageYOriginStartPercentage(direction, xOriginStartPercentage, yOriginStartPercentage) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof xOriginStartPercentage !== "number") throw new Error("xOriginStartPercentage should be a number, but got " + (xOriginStartPercentage + (" (" + (typeof xOriginStartPercentage + ")"))));
    if (typeof yOriginStartPercentage !== "number") throw new Error("yOriginStartPercentage should be a number, but got " + (yOriginStartPercentage + (" (" + (typeof yOriginStartPercentage + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSwipeFastInDirection:xOriginStartPercentage:yOriginStartPercentage:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "CGFloat",
        value: xOriginStartPercentage
      }, {
        type: "CGFloat",
        value: yOriginStartPercentage
      }]
    };
  }

  /*Returns an action that swipes through the view quickly in the given @c direction from a
specific origin.

@param direction              The direction of the swipe.
@param xOriginStartPercentage the x start position as a percentage of the total width
of the view. This must be between 0 and 1.
@param yOriginStartPercentage the y start position as a percentage of the total height
of the view. This must be between 0 and 1.

@return A GREYAction that performs a slow swipe through a view in a specific direction from
the specified point.
*/static actionForSwipeSlowInDirectionXOriginStartPercentageYOriginStartPercentage(direction, xOriginStartPercentage, yOriginStartPercentage) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof xOriginStartPercentage !== "number") throw new Error("xOriginStartPercentage should be a number, but got " + (xOriginStartPercentage + (" (" + (typeof xOriginStartPercentage + ")"))));
    if (typeof yOriginStartPercentage !== "number") throw new Error("yOriginStartPercentage should be a number, but got " + (yOriginStartPercentage + (" (" + (typeof yOriginStartPercentage + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSwipeSlowInDirection:xOriginStartPercentage:yOriginStartPercentage:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "CGFloat",
        value: xOriginStartPercentage
      }, {
        type: "CGFloat",
        value: yOriginStartPercentage
      }]
    };
  }

  /*Returns an action that performs a multi-finger slow swipe through the view in the given
@c direction.

@param direction       The direction of the swipe.
@param numberOfFingers Number of fingers touching the screen for the swipe.

@return A GREYAction that performs a multi-finger slow swipe through a view in a specific
direction from the specified point.
*/static actionForMultiFingerSwipeSlowInDirectionNumberOfFingers(direction, numberOfFingers) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof numberOfFingers !== "number") throw new Error("numberOfFingers should be a number, but got " + (numberOfFingers + (" (" + (typeof numberOfFingers + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForMultiFingerSwipeSlowInDirection:numberOfFingers:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "NSInteger",
        value: numberOfFingers
      }]
    };
  }

  /*Returns an action that performs a multi-finger fast swipe through the view in the given
@c direction.

@param direction       The direction of the swipe.
@param numberOfFingers Number of fingers touching the screen for the swipe.

@return A GREYAction that performs a multi-finger fast swipe through a view in a specific
direction from the specified point.
*/static actionForMultiFingerSwipeFastInDirectionNumberOfFingers(direction, numberOfFingers) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof numberOfFingers !== "number") throw new Error("numberOfFingers should be a number, but got " + (numberOfFingers + (" (" + (typeof numberOfFingers + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForMultiFingerSwipeFastInDirection:numberOfFingers:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "NSInteger",
        value: numberOfFingers
      }]
    };
  }

  /*Returns an action that performs a multi-finger slow swipe through the view in the given
@c direction.

@param direction       The direction of the swipe.
@param numberOfFingers Number of fingers touching the screen for the swipe.

@return A GREYAction that performs a multi-finger slow swipe through a view in a specific
direction from the specified point.
*/static actionForMultiFingerSwipeSlowInDirectionNumberOfFingersXOriginStartPercentageYOriginStartPercentage(direction, numberOfFingers, xOriginStartPercentage, yOriginStartPercentage) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof numberOfFingers !== "number") throw new Error("numberOfFingers should be a number, but got " + (numberOfFingers + (" (" + (typeof numberOfFingers + ")"))));
    if (typeof xOriginStartPercentage !== "number") throw new Error("xOriginStartPercentage should be a number, but got " + (xOriginStartPercentage + (" (" + (typeof xOriginStartPercentage + ")"))));
    if (typeof yOriginStartPercentage !== "number") throw new Error("yOriginStartPercentage should be a number, but got " + (yOriginStartPercentage + (" (" + (typeof yOriginStartPercentage + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForMultiFingerSwipeSlowInDirection:numberOfFingers:xOriginStartPercentage:yOriginStartPercentage:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "NSInteger",
        value: numberOfFingers
      }, {
        type: "CGFloat",
        value: xOriginStartPercentage
      }, {
        type: "CGFloat",
        value: yOriginStartPercentage
      }]
    };
  }

  /*Returns an action that performs a multi-finger fast swipe through the view in the given
@c direction.

@param direction       The direction of the swipe.
@param numberOfFingers Number of fingers touching the screen for the swipe.

@return A GREYAction that performs a multi-finger fast swipe through a view in a specific
direction from the specified point.
*/static actionForMultiFingerSwipeFastInDirectionNumberOfFingersXOriginStartPercentageYOriginStartPercentage(direction, numberOfFingers, xOriginStartPercentage, yOriginStartPercentage) {
    if (!["left", "right", "up", "down"].some(option => option === direction)) throw new Error("direction should be one of [left, right, up, down], but got " + direction);
    if (typeof numberOfFingers !== "number") throw new Error("numberOfFingers should be a number, but got " + (numberOfFingers + (" (" + (typeof numberOfFingers + ")"))));
    if (typeof xOriginStartPercentage !== "number") throw new Error("xOriginStartPercentage should be a number, but got " + (xOriginStartPercentage + (" (" + (typeof xOriginStartPercentage + ")"))));
    if (typeof yOriginStartPercentage !== "number") throw new Error("yOriginStartPercentage should be a number, but got " + (yOriginStartPercentage + (" (" + (typeof yOriginStartPercentage + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForMultiFingerSwipeFastInDirection:numberOfFingers:xOriginStartPercentage:yOriginStartPercentage:",
      args: [{
        type: "GREYDirection",
        value: sanitize_greyDirection(direction)
      }, {
        type: "NSInteger",
        value: numberOfFingers
      }, {
        type: "CGFloat",
        value: xOriginStartPercentage
      }, {
        type: "CGFloat",
        value: yOriginStartPercentage
      }]
    };
  }

  /*Returns an action that pinches view quickly in the specified @c direction and @c angle.

@param  pinchDirection The direction of the pinch action.
@param  angle          The angle of the pinch action in radians.
Use @c kGREYPinchAngleDefault for the default angle (currently set to
30 degrees).

@return A GREYAction that performs a fast pinch on the view in the specified @c direction.
*/static actionForPinchFastInDirectionWithAngle(pinchDirection, angle) {
    if (!["outward", "inward"].some(option => option === pinchDirection)) throw new Error("pinchDirection should be one of [outward, inward], but got " + pinchDirection);
    if (typeof angle !== "number") throw new Error("angle should be a number, but got " + (angle + (" (" + (typeof angle + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForPinchFastInDirection:withAngle:",
      args: [{
        type: "GREYPinchDirection",
        value: pinchDirection
      }, {
        type: "double",
        value: angle
      }]
    };
  }

  /*Returns an action that pinches view slowly in the specified @c direction and @c angle.

@param  pinchDirection The direction of the pinch action.
@param  angle          The angle of the pinch action in radians.
Use @c kGREYPinchAngleDefault for the default angle (currently set to
30 degrees).

@return A GREYAction that performs a slow pinch on the view in the specified @c direction.
*/static actionForPinchSlowInDirectionWithAngle(pinchDirection, angle) {
    if (!["outward", "inward"].some(option => option === pinchDirection)) throw new Error("pinchDirection should be one of [outward, inward], but got " + pinchDirection);
    if (typeof angle !== "number") throw new Error("angle should be a number, but got " + (angle + (" (" + (typeof angle + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForPinchSlowInDirection:withAngle:",
      args: [{
        type: "GREYPinchDirection",
        value: pinchDirection
      }, {
        type: "double",
        value: angle
      }]
    };
  }

  /*Returns an action that attempts to move slider to within 1.0e-6f values of @c value.

@param value The value to which the slider should be moved. If this is not attainable after a
reasonable number of attempts (currently 10) we assume that the @c value is
unattainable for a user (it is probably the case this value resides between two
pixels). In this case, the slider will end up at a user attainable value
that is closest to @c value.

@return A GREYAction that moves a slider to a given @c value.
*/static actionForMoveSliderToValue(value) {
    if (typeof value !== "number") throw new Error("value should be a number, but got " + (value + (" (" + (typeof value + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForMoveSliderToValue:",
      args: [{
        type: "float",
        value: value
      }]
    };
  }

  /*Returns an action that changes the value of UIStepper to @c value by tapping the appropriate
button multiple times.

@param value The value to change the UIStepper to.

@return A GREYAction that sets the given @c value on a stepper.
*/static actionForSetStepperValue(value) {
    if (typeof value !== "number") throw new Error("value should be a number, but got " + (value + (" (" + (typeof value + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSetStepperValue:",
      args: [{
        type: "double",
        value: value
      }]
    };
  }

  /*Returns an action that taps on an element at the activation point of the element.

@return A GREYAction to tap on an element.
*/static actionForTap() {
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForTap",
      args: []
    };
  }

  /*Returns an action that taps on an element at the specified @c point.

@param point The point that should be tapped. It must be in the coordinate system of the
element and it's position is relative to the origin of the element, as in
(element_width/2, element_height/2) will tap at the center of element.

@return A GREYAction to tap on an element at a specific point.
*/static actionForTapAtPoint(point) {
    if (typeof point !== "object") throw new Error("point should be a object, but got " + (point + (" (" + (typeof point + ")"))));
    if (typeof point.x !== "number") throw new Error("point.x should be a number, but got " + (point.x + (" (" + (typeof point.x + ")"))));
    if (typeof point.y !== "number") throw new Error("point.y should be a number, but got " + (point.y + (" (" + (typeof point.y + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForTapAtPoint:",
      args: [{
        type: "CGPoint",
        value: point
      }]
    };
  }

  /*Returns an action that uses the iOS keyboard to input a string.

@param text The text to be typed. For Objective-C, backspace is supported by using "\b" in the
string and "\u{8}" in Swift strings. Return key is supported with "\n".
For Example: @"Helpo\b\bloWorld" will type HelloWorld in Objective-C.
"Helpo\u{8}\u{8}loWorld" will type HelloWorld in Swift.

@return A GREYAction to type a specific text string in a text field.
*/static actionForTypeText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForTypeText:",
      args: [{
        type: "NSString",
        value: text
      }]
    };
  }

  /*Returns an action that sets text on a UITextField or webview input directly.

@param text The text to be typed.

@return A GREYAction to type a specific text string in a text field.
*/static actionForReplaceText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForReplaceText:",
      args: [{
        type: "NSString",
        value: text
      }]
    };
  }

  /*@return A GREYAction that clears a text field by injecting back-spaces.
*/static actionForClearText() {
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForClearText",
      args: []
    };
  }

  /*Returns an action that toggles a switch control. This action is applicable to all elements that
implement the selector UISwitch::isOn and include UISwitch controls.

@param on The switch control state.

@return A GREYAction to toggle a UISwitch.
*/static actionForTurnSwitchOn(on) {
    if (typeof on !== "boolean") throw new Error("on should be a boolean, but got " + (on + (" (" + (typeof on + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForTurnSwitchOn:",
      args: [{
        type: "BOOL",
        value: on
      }]
    };
  }

  /*Returns an action that injects dates/times into UIDatePickers.

@param date The date to set the UIDatePicker.

@return A GREYAction that sets a given date/time on a UIDatePicker.
*/static actionForSetDate(date) {
    if (typeof date !== "number") throw new Error("date should be a number, but got " + (date + (" (" + (typeof date + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSetDate:",
      args: [{
        type: "NSDate *",
        value: date
      }]
    };
  }

  /*Returns an action that selects @c value on the given @c column of a UIPickerView.

@param column The UIPickerView column being set.
@param value  The value to set the UIPickerView.

@return A GREYAction to set the value of a specified column of a UIPickerView.
*/static actionForSetPickerColumnToValue(column, value) {
    if (typeof column !== "number") throw new Error("column should be a number, but got " + (column + (" (" + (typeof column + ")"))));
    if (typeof value !== "string") throw new Error("value should be a string, but got " + (value + (" (" + (typeof value + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSetPickerColumn:toValue:",
      args: [{
        type: "NSInteger",
        value: column
      }, {
        type: "NSString",
        value: value
      }]
    };
  }

  /*Returns an action that executes JavaScript against a UIWebView and sets the return value to
@c outResult if provided.

@param js        The Javascript code to be executed.
@param outResult The result of the code execution.

@return A GREYAction that executes JavaScript code against a UIWebView.
*/static actionForJavaScriptExecutionOutput(js, outResult) {
    if (typeof js !== "string") throw new Error("js should be a string, but got " + (js + (" (" + (typeof js + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForJavaScriptExecution:output:",
      args: [{
        type: "NSString",
        value: js
      }, {
        type: "out __strong NSString **",
        value: outResult
      }]
    };
  }

  /*Returns an action that takes a snapshot of the selected element.

@param outImage The UIImage where the image content is stored.

@return A GREYAction that takes a snapshot of an UI element.
*/static actionForSnapshot(outImage) {
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "actionForSnapshot:",
      args: [{
        type: "out __strong UIImage **",
        value: outImage
      }]
    };
  }

}

module.exports = GREYActions;