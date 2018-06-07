/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_uiAccessibilityTraits(value) {
  let traits = 0;
  for (let i = 0; i < value.length; i++) {
    switch (value[i]) {
      case 'button':
        traits |= 1;
        break;
      case 'link':
        traits |= 2;
        break;
      case 'header':
        traits |= 4;
        break;
      case 'search':
        traits |= 8;
        break;
      case 'image':
        traits |= 16;
        break;
      case 'selected':
        traits |= 32;
        break;
      case 'plays':
        traits |= 64;
        break;
      case 'key':
        traits |= 128;
        break;
      case 'text':
        traits |= 256;
        break;
      case 'summary':
        traits |= 512;
        break;
      case 'disabled':
        traits |= 1024;
        break;
      case 'frequentUpdates':
        traits |= 2048;
        break;
      case 'startsMedia':
        traits |= 4096;
        break;
      case 'adjustable':
        traits |= 8192;
        break;
      case 'allowsDirectInteraction':
        traits |= 16384;
        break;
      case 'pageTurn':
        traits |= 32768;
        break;
      default:
        throw new Error(
          `Unknown trait '${value[i]}', see list in https://facebook.github.io/react-native/docs/accessibility.html#accessibilitytraits-ios`
        );
    }
  }

  return traits;
} 
function sanitize_greyContentEdge(action) {
  switch (action) {
    case 'left':
      return 0;
    case 'right':
      return 1;
    case 'top':
      return 2;
    case 'bottom':
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

  /*Matcher for UI element with the provided accessibility @c traits.

@param traits The accessibility traits to be matched.

@return A matcher for the accessibility traits of an accessible element.

*/static matcherForAccessibilityTraits(traits) {
    if (typeof traits !== 'object' || !traits instanceof Array) {
      throw new Error('traits must be an array, got ' + typeof traits);
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAccessibilityTraits:",
      args: [{
        type: "NSInteger",
        value: sanitize_uiAccessibilityTraits(traits)
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
that are more than @c kElementSufficientlyVisiblePercentage (75 %) visible areawise to be
sufficiently visible.

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

  /*Matcher for UI element that is not visible to the user at all i.e. it has a zero visible area.

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

  /*Matcher for UI element that matches EarlGrey's criteria for user interaction. Currently it must
satisfy at least the following criteria:
1) At least a few pixels of the element are visible to the user.
2) The element's accessibility activation point OR the center of the element's visible area
is completely visible.

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

  /*Matcher for matching UIProgressView's values. Use greaterThan, greaterThanOrEqualTo,
lessThan etc to create @c comparisonMatcher. For example, to match the UIProgressView
elements that have progress value greater than 50.2, use
@code [GREYMatchers matcherForProgress:grey_greaterThan(@(50.2))] @endcode. In case if an
unimplemented matcher is required, please implement it similar to @c grey_closeTo.

@param comparisonMatcher The matcher with the value to check the progress against.

@return A matcher for checking a UIProgessView's value.
*/static matcherForProgress(comparisonMatcher) {
    if (typeof comparisonMatcher !== "object" || comparisonMatcher.type !== "Invocation" || typeof comparisonMatcher.value !== "object" || typeof comparisonMatcher.value.target !== "object" || comparisonMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('comparisonMatcher should be a GREYMatcher, but got ' + JSON.stringify(comparisonMatcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForProgress:",
      args: [comparisonMatcher]
    };
  }

  /*Matcher that matches UI element based on the presence of an ancestor in its hierarchy.
The given matcher is used to match decendants.

@param ancestorMatcher The ancestor UI element whose descendants are to be matched.

@return A matcher to check if a UI element is the descendant of another.
*/static matcherForAncestor(ancestorMatcher) {
    if (typeof ancestorMatcher !== "object" || ancestorMatcher.type !== "Invocation" || typeof ancestorMatcher.value !== "object" || typeof ancestorMatcher.value.target !== "object" || ancestorMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('ancestorMatcher should be a GREYMatcher, but got ' + JSON.stringify(ancestorMatcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForAncestor:",
      args: [ancestorMatcher]
    };
  }

  /*Matcher that matches any UI element with a descendant matching the given matcher.

@param descendantMatcher A matcher being checked to be a descendant
of the UI element being checked.

@return A matcher to check if a the specified element is in a descendant of another UI element.
*/static matcherForDescendant(descendantMatcher) {
    if (typeof descendantMatcher !== "object" || descendantMatcher.type !== "Invocation" || typeof descendantMatcher.value !== "object" || typeof descendantMatcher.value.target !== "object" || descendantMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('descendantMatcher should be a GREYMatcher, but got ' + JSON.stringify(descendantMatcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForDescendant:",
      args: [descendantMatcher]
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

  /*Matcher that matches a UISlider's value.

@param valueMatcher A matcher for the UISlider's value. You must provide a valid
@c valueMatcher for the floating point value comparison. The
@c valueMatcher should be of the type @c closeTo, @c greaterThan,
@c lessThan, @c lessThanOrEqualTo, @c greaterThanOrEqualTo. The
value matchers should account for any loss in precision for the given
floating point value. If you are using @c grey_closeTo, use delta diff as
@c kGREYAcceptableFloatDifference. In case if an unimplemented matcher
is required, please implement it similar to @c grey_closeTo.

@return A matcher for checking a UISlider's value.
*/static matcherForSliderValueMatcher(valueMatcher) {
    if (typeof valueMatcher !== "object" || valueMatcher.type !== "Invocation" || typeof valueMatcher.value !== "object" || typeof valueMatcher.value.target !== "object" || valueMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('valueMatcher should be a GREYMatcher, but got ' + JSON.stringify(valueMatcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForSliderValueMatcher:",
      args: [valueMatcher]
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

  /*A Matcher that checks if a provided object is equal to the specified @c value. The equality is
determined by calling the @c isEqual: method of the object being examined. In case the @c
value is @c nil, then the object itself is checked to be @c nil.

@param value  The value to be checked for equality. Please ensure that scalar types are
passed in as boxed (object) values.

@return A matcher that checks if an object is equal to the provided one.
*/static matcherForEqualTo(value) {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForEqualTo:",
      args: [value]
    };
  }

  /*A Matcher that checks if a provided object is less than a specified @c value. The comparison
is made by calling the @c compare: method of the object being examined.

@param value The value to be compared, which should return @c NSOrderedDescending. Please
ensure that scalar values are passed in as boxed (object) values.

@return A matcher that checks an object is lesser than another provided @c value.
*/static matcherForLessThan(value) {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForLessThan:",
      args: [value]
    };
  }

  /*A Matcher that checks if a provided object is greater than a specified @c value. The comparison
is made by calling the @c compare: method of the object being examined.

@param value The value to be compared, which should return @c NSOrderedAscending. Please
ensure that scalar values are passed in as boxed (object) values.

@return A matcher that checks an object is greater than another provided @c value.
*/static matcherForGreaterThan(value) {
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "matcherForGreaterThan:",
      args: [value]
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