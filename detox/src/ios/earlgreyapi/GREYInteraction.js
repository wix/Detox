/**

	This code is generated.
	For more information see generation/README.md.
*/



class GREYInteraction {
  /*Indicates that the current interaction should be performed on a UI element contained inside
another UI element that is uniquely matched by @c rootMatcher.

@param rootMatcher Matcher used to select the container of the element the interaction
will be performed on.

@return The provided GREYInteraction instance, with an appropriate rootMatcher.
*/static inRoot(element, rootMatcher) {
    if (typeof rootMatcher !== "object" || rootMatcher.type !== "Invocation" || typeof rootMatcher.value !== "object" || typeof rootMatcher.value.target !== "object" || rootMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('rootMatcher should be a GREYMatcher, but got ' + JSON.stringify(rootMatcher));
    }

    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "inRoot:",
      args: [rootMatcher]
    };
  }

  /*Performs the @c action repeatedly on the the element matching the @c matcher until the element
to interact with (specified by GREYInteraction::selectElementWithMatcher:) is found or a
timeout occurs. The search action is only performed when coupled with
GREYInteraction::performAction:, GREYInteraction::assert:, or
GREYInteraction::assertWithMatcher: APIs. This API only creates an interaction consisting of
repeated executions of the search action provided. You need to call an action or assertion
after this in order to interaction with the element being searched for.

For example, this code will perform an upward scroll of 50 points until an element is found
and then tap on it:
@code
[[[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"elementToFind")]
usingSearchAction:grey_scrollInDirection(kGREYDirectionUp, 50.0f)
onElementWithMatcher:grey_accessibilityID(@"ScrollingWindow")]
performAction:grey_tap()] // This should be separately called for the action.
@endcode

@param action  The action to be performed on the element.
@param matcher The matcher that the element matches.

@return The provided GREYInteraction instance, with an appropriate action and matcher.
*/static usingSearchActionOnElementWithMatcher(element, action, matcher) {
    if (typeof action !== "object" || action.type !== "Invocation" || typeof action.value !== "object" || typeof action.value.target !== "object" || action.value.target.value !== "GREYActions") {
      throw new Error('action should be a GREYAction, but got ' + JSON.stringify(action));
    }

    if (typeof matcher !== "object" || matcher.type !== "Invocation" || typeof matcher.value !== "object" || typeof matcher.value.target !== "object" || matcher.value.target.value !== "GREYMatchers") {
      throw new Error('matcher should be a GREYMatcher, but got ' + JSON.stringify(matcher));
    }

    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "usingSearchAction:onElementWithMatcher:",
      args: [action, matcher]
    };
  }

  /*Performs an @c action on the selected UI element.

@param action The action to be performed on the @c element.
@throws NSException if the action fails.

@return The provided GREYInteraction instance with an appropriate action.
*/static performAction(element, action) {
    if (typeof action !== "object" || action.type !== "Invocation" || typeof action.value !== "object" || typeof action.value.target !== "object" || action.value.target.value !== "GREYActions") {
      throw new Error('action should be a GREYAction, but got ' + JSON.stringify(action));
    }

    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "performAction:",
      args: [action]
    };
  }

  /*Performs an assertion that evaluates @c matcher on the selected UI element.

@param matcher The matcher to be evaluated on the @c element.

@return The provided GREYInteraction instance with a matcher to be evaluated on an element.
*/static assertWithMatcher(element, matcher) {
    if (typeof matcher !== "object" || matcher.type !== "Invocation" || typeof matcher.value !== "object" || typeof matcher.value.target !== "object" || matcher.value.target.value !== "GREYMatchers") {
      throw new Error('matcher should be a GREYMatcher, but got ' + JSON.stringify(matcher));
    }

    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "assertWithMatcher:",
      args: [matcher]
    };
  }

  /*In case of multiple matches, selects the element at the specified index. In case of the
index being over the number of matched elements, it throws an exception. Please make sure
that this is used after you've created the matcher. For example, in case three elements are
matched, and you wish to match with the second one, then @c atIndex would be used in this
manner:

@code
[[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Generic Matcher")] atIndex:1];
@endcode

@param index        The zero-indexed position of the element in the list of matched elements
to be selected.
@throws NSException if the @c index is more than the number of matched elements.

@return An interaction (assertion or an action) to be performed on the element at the
specified index in the list of matched elements.
*/static atIndex(element, index) {
    if (typeof index !== "number") throw new Error("index should be a number, but got " + (index + (" (" + (typeof index + ")"))));
    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "atIndex:",
      args: [{
        type: "NSInteger",
        value: index
      }]
    };
  }

}

module.exports = GREYInteraction;