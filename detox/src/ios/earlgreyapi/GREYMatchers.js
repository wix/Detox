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

function sanitize_greyContentEdge(action) {
  switch (action) {
    case "left":
      return 0;
    case "right":
      return 1;
    case "top":
      return 2;
    case "bottom":
      return 3;

    default:
      throw new Error(`GREYAction.GREYContentEdge must be a 'left'/'right'/'top'/'bottom', got ${action}`);
  }
}



class GREYMatchers {
  /*Matcher for application's key window.

@return A matcher for the application's key window.
*/static matcherForKeyWindow() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForKeyWindow",
      args: []
    };
  }

  /*Matcher for UI element with the provided accessibility @c label.

@param label The accessibility label to be matched.

@return A matcher for the accessibility label of an accessible element.
*/static matcherForAccessibilityLabel(label) {
    if (typeof label !== "string") throw new Error("label should be a string, but got " + (label + (" (" + (typeof label + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAccessibilityLabel:",
      args: [{
        type: "NSString",
        value: label
      }]
    };
  }

  /*Matcher for UI element with the provided accessibility ID @c accessibilityID.

@param accessibilityID The accessibility ID to be matched.

@return A matcher for the accessibility ID of an accessible element.
*/static matcherForAccessibilityID(accessibilityID) {
    if (typeof accessibilityID !== "string") throw new Error("accessibilityID should be a string, but got " + (accessibilityID + (" (" + (typeof accessibilityID + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAccessibilityID:",
      args: [{
        type: "NSString",
        value: accessibilityID
      }]
    };
  }

  /*Matcher for UI element with the provided accessibility @c value.

@param value The accessibility value to be matched.

@return A matcher for the accessibility value of an accessible element.
*/static matcherForAccessibilityValue(value) {
    if (typeof value !== "string") throw new Error("value should be a string, but got " + (value + (" (" + (typeof value + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAccessibilityValue:",
      args: [{
        type: "NSString",
        value: value
      }]
    };
  }

  /*Matcher for UI element with the provided accessiblity @c hint.

@param hint The accessibility hint to be matched.

@return A matcher for the accessibility hint of an accessible element.
*/static matcherForAccessibilityHint(hint) {
    if (typeof hint !== "string") throw new Error("hint should be a string, but got " + (hint + (" (" + (typeof hint + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAccessibilityHint:",
      args: [{
        type: "NSString",
        value: hint
      }]
    };
  }

  /*Matcher for UI element with accessiblity focus.

@return A matcher for the accessibility focus of an accessible element.
*/static matcherForAccessibilityElementIsFocused() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAccessibilityElementIsFocused",
      args: []
    };
  }

  /*Matcher for UI elements of type UIButton, UILabel, UITextField or UITextView displaying the
provided @c inputText.

@param text The text to be matched in the UI elements.

@return A matcher to check for any UI elements with a text field containing the given text.
*/static matcherForText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForText:",
      args: [{
        type: "NSString",
        value: text
      }]
    };
  }

  /*Matcher for element that is the first responder.

@return A matcher that verifies if a UI element is the first responder.
*/static matcherForFirstResponder() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForFirstResponder",
      args: []
    };
  }

  /*Matcher to check if system alert view is shown.

@return A matcher to check if a system alert view is being shown.
*/static matcherForSystemAlertViewShown() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForSystemAlertViewShown",
      args: []
    };
  }

  /*Matcher for UI element whose percent visible area (of its accessibility frame) exceeds the
given @c percent.

@param percent The percent visible area that the UI element being matched has to be visible.
Allowed values for @c percent are [0,1] inclusive.

@return A matcher that checks if a UI element has a visible area at least equal
to a minimum value.
*/static matcherForMinimumVisiblePercent(percent) {
    if (typeof percent !== "number") throw new Error("percent should be a number, but got " + (percent + (" (" + (typeof percent + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForMinimumVisiblePercent:",
      args: [{
        type: "CGFloat",
        value: percent
      }]
    };
  }

  /*Matcher for UI element that is sufficiently visible to the user. EarlGrey considers elements
with visible area percentage greater than @c kElementSufficientlyVisiblePercentage (0.75)
to be sufficiently visible.

@return A matcher intialized with a visibility percentage that confirms an element is
sufficiently visible.
*/static matcherForSufficientlyVisible() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForSufficientlyVisible",
      args: []
    };
  }

  /*Matcher for UI element that are not visible to the user i.e. has a zero visible area.

@return A matcher for verifying if an element is not visible.
*/static matcherForNotVisible() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForNotVisible",
      args: []
    };
  }

  /*Matcher for UI element that matches EarlGrey's criteria for user interaction currently it must
satisfy at least the following criteria:
<ul>
<li>At least a few pixels of the element's UI are visible.</li>
<li>The element's accessibility activation point OR the center of the element's visible area
is visible.</li>
</ul>

@return A matcher that checks if a UI element is interactable.
*/static matcherForInteractable() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForInteractable",
      args: []
    };
  }

  /*Matcher to check if a UI element is accessible.

@return A matcher that checks if a UI element is accessible.
*/static matcherForAccessibilityElement() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAccessibilityElement",
      args: []
    };
  }

  /*Matcher that matches UIButton that has title label as @c text.

@param title The title to be checked on the UIButtons being matched.

@return A matcher to confirm UIButton titles.
*/static matcherForButtonTitle(title) {
    if (typeof title !== "string") throw new Error("title should be a string, but got " + (title + (" (" + (typeof title + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForButtonTitle:",
      args: [{
        type: "NSString",
        value: title
      }]
    };
  }

  /*Matcher that matches UIScrollView that has contentOffset as @c offset.

@param offset The content offset to be checked on the UIScrollView being
matched.

@return A matcher to confirm UIScrollView content offset.
*/static matcherForScrollViewContentOffset(offset) {
    if (typeof offset !== "object") throw new Error("offset should be a object, but got " + (offset + (" (" + (typeof offset + ")"))));
    if (typeof offset.x !== "number") throw new Error("offset.x should be a number, but got " + (offset.x + (" (" + (typeof offset.x + ")"))));
    if (typeof offset.y !== "number") throw new Error("offset.y should be a number, but got " + (offset.y + (" (" + (typeof offset.y + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForScrollViewContentOffset:",
      args: [{
        type: "CGPoint",
        value: offset
      }]
    };
  }

  /*Matcher that matches UIPickerView that has a column set to @c value.

@param column The column of the UIPickerView to be matched.
@param value  The value that should be set in the column of the UIPickerView.

@return A matcher to check the value in a particular column of a UIPickerView.
*/static matcherForPickerColumnSetToValue(column, value) {
    if (typeof column !== "number") throw new Error("column should be a number, but got " + (column + (" (" + (typeof column + ")"))));
    if (typeof value !== "string") throw new Error("value should be a string, but got " + (value + (" (" + (typeof value + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForPickerColumn:setToValue:",
      args: [{
        type: "NSInteger",
        value: column
      }, {
        type: "NSString",
        value: value
      }]
    };
  }

  /*Matcher that verifies whether an element, that is a UIControl, is enabled.

@return A matcher for checking whether a UI element is an enabled UIControl.
*/static matcherForEnabledElement() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForEnabledElement",
      args: []
    };
  }

  /*Matcher that verifies whether an element, that is a UIControl, is selected.

@return A matcher for checking whether a UI element is a selected UIControl.
*/static matcherForSelectedElement() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForSelectedElement",
      args: []
    };
  }

  /*Matcher that verifies whether a view has its userInteractionEnabled property set to @c YES.

@return A matcher for checking whether a view' userInteractionEnabled property is set to @c YES.
*/static matcherForUserInteractionEnabled() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForUserInteractionEnabled",
      args: []
    };
  }

  /*Matcher primarily for asserting that the element is @c nil or not found.

@return A matcher to check if a specified element is @c nil or not found.
*/static matcherForNil() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForNil",
      args: []
    };
  }

  /*Matcher for asserting that the element exists in the UI hierarchy (i.e. not @c nil).

@return A matcher to check if a specified element is not @c nil.
*/static matcherForNotNil() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForNotNil",
      args: []
    };
  }

  /*A Matcher that matches against any object, including @c nils.

@return A matcher that matches any object.
*/static matcherForAnything() {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAnything",
      args: []
    };
  }

  /*Matcher that matches a UIScrollView scrolled to content @c edge.

@param edge The content edge UIScrollView should be scrolled to.

@return A matcher that matches a UIScrollView scrolled to content @c edge.
*/static matcherForScrolledToContentEdge(edge) {
    if (!["left", "right", "top", "bottom"].some(option => option === edge)) throw new Error("edge should be one of [left, right, top, bottom], but got " + edge);
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForScrolledToContentEdge:",
      args: [{
        type: "NSInteger",
        value: sanitize_greyContentEdge(edge)
      }]
    };
  }

  /*Matcher that matches a UITextField's content.

@param value The text string contained inside the UITextField.

@return A matcher that matches the value inside a UITextField.
*/static matcherForTextFieldValue(value) {
    if (typeof value !== "string") throw new Error("value should be a string, but got " + (value + (" (" + (typeof value + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForTextFieldValue:",
      args: [{
        type: "NSString",
        value: value
      }]
    };
  }

}

module.exports = GREYMatchers;