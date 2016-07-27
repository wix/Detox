//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import "Action/GREYActions.h"

#import "Action/GREYAction.h"
#import "Action/GREYActionBlock.h"
#import "Action/GREYChangeStepperAction.h"
#import "Action/GREYPickerAction.h"
#import "Action/GREYScrollAction.h"
#import "Action/GREYScrollToContentEdgeAction.h"
#import "Action/GREYSlideAction.h"
#import "Action/GREYSwipeAction.h"
#import "Action/GREYTapAction.h"
#import "Additions/NSError+GREYAdditions.h"
#import "Additions/NSObject+GREYAdditions.h"
#import "Additions/NSString+GREYAdditions.h"
#import "Additions/UISwitch+GREYAdditions.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYExposed.h"
#import "Common/GREYScreenshotUtil.h"
#import "Core/GREYInteraction.h"
#import "Core/GREYKeyboard.h"
#import "Matcher/GREYAllOf.h"
#import "Matcher/GREYAnyOf.h"
#import "Matcher/GREYMatcher.h"
#import "Matcher/GREYMatchers.h"
#import "Matcher/GREYNot.h"
#import "Synchronization/GREYUIThreadExecutor.h"
#import "Synchronization/GREYUIWebViewIdlingResource.h"

@implementation GREYActions

+ (id<GREYAction>)actionForSwipeFastInDirection:(GREYDirection)direction {
  return [[GREYSwipeAction alloc] initWithDirection:direction duration:kGREYSwipeFastDuration];
}

+ (id<GREYAction>)actionForSwipeSlowInDirection:(GREYDirection)direction {
  return [[GREYSwipeAction alloc] initWithDirection:direction duration:kGREYSwipeSlowDuration];
}

+ (id<GREYAction>)actionForSwipeFastInDirection:(GREYDirection)direction
                         xOriginStartPercentage:(CGFloat)xOriginStartPercentage
                         yOriginStartPercentage:(CGFloat)yOriginStartPercentage {
  return [[GREYSwipeAction alloc] initWithDirection:direction
                                           duration:kGREYSwipeFastDuration
                                      startPercents:CGPointMake(xOriginStartPercentage,
                                                                yOriginStartPercentage)];
}

+ (id<GREYAction>)actionForSwipeSlowInDirection:(GREYDirection)direction
                         xOriginStartPercentage:(CGFloat)xOriginStartPercentage
                         yOriginStartPercentage:(CGFloat)yOriginStartPercentage {
  return [[GREYSwipeAction alloc] initWithDirection:direction
                                           duration:kGREYSwipeSlowDuration
                                      startPercents:CGPointMake(xOriginStartPercentage,
                                                                yOriginStartPercentage)];
}

+ (id<GREYAction>)actionForMoveSliderToValue:(float)value {
  return [[GREYSlideAction alloc] initWithSliderValue:value];
}

+ (id<GREYAction>)actionForSetStepperValue:(double)value {
  return [[GREYChangeStepperAction alloc] initWithValue:value];
}

+ (id<GREYAction>)actionForTap {
  return [[GREYTapAction alloc] initWithType:kGREYTapTypeShort];
}

+ (id<GREYAction>)actionForTapAtPoint:(CGPoint)point {
  return [[GREYTapAction alloc] initWithType:kGREYTapTypeShort numberOfTaps:1 location:point];
}

+ (id<GREYAction>)actionForLongPress {
  return [GREYActions actionForLongPressWithDuration:kGREYLongPressDefaultDuration];
}

+ (id<GREYAction>)actionForLongPressWithDuration:(CFTimeInterval)duration {
  return [[GREYTapAction alloc] initLongPressWithDuration:duration];
}

+ (id<GREYAction>)actionForLongPressAtPoint:(CGPoint)point duration:(CFTimeInterval)duration {
  return [[GREYTapAction alloc] initLongPressWithDuration:duration location:point];
}

+ (id<GREYAction>)actionForMultipleTapsWithCount:(NSUInteger)count {
  return [[GREYTapAction alloc] initWithType:kGREYTapTypeMultiple numberOfTaps:count];
}

// The |amount| is in points
+ (id<GREYAction>)actionForScrollInDirection:(GREYDirection)direction amount:(CGFloat)amount {
  return [[GREYScrollAction alloc] initWithDirection:direction amount:amount];
}

+ (id<GREYAction>)actionForScrollInDirection:(GREYDirection)direction
                                      amount:(CGFloat)amount
                      xOriginStartPercentage:(CGFloat)xOriginStartPercentage
                      yOriginStartPercentage:(CGFloat)yOriginStartPercentage {
  return [[GREYScrollAction alloc] initWithDirection:direction
                                              amount:amount
                                  startPointPercents:CGPointMake(xOriginStartPercentage,
                                                                 yOriginStartPercentage)];
}

+ (id<GREYAction>)actionForScrollToContentEdge:(GREYContentEdge)edge {
  return [[GREYScrollToContentEdgeAction alloc] initWithEdge:edge];
}

+ (id<GREYAction>)actionForScrollToContentEdge:(GREYContentEdge)edge
                        xOriginStartPercentage:(CGFloat)xOriginStartPercentage
                        yOriginStartPercentage:(CGFloat)yOriginStartPercentage {
  return [[GREYScrollToContentEdgeAction alloc] initWithEdge:edge
                                          startPointPercents:CGPointMake(xOriginStartPercentage,
                                                                         yOriginStartPercentage)];
}

+ (id<GREYAction>)actionForTurnSwitchOn:(BOOL)on {
  id<GREYMatcher> constraints = grey_allOf(grey_not(grey_systemAlertViewShown()),
                                           grey_respondsToSelector(@selector(isOn)), nil);
  NSString *actionName = [NSString stringWithFormat:@"Turn switch to %@ state",
                             [UISwitch grey_stringFromOnState:on]];
  return [GREYActionBlock actionWithName:actionName
                             constraints:constraints
                            performBlock:^BOOL (id switchView, __strong NSError **errorOrNil) {
    if (([switchView isOn] && !on) || (![switchView isOn] && on)) {
      id<GREYAction> longPressAction =
          [GREYActions actionForLongPressWithDuration:kGREYLongPressDefaultDuration];
      return [longPressAction perform:switchView error:errorOrNil];
    }
    return YES;
  }];
}

+ (id<GREYAction>)actionForTypeText:(NSString *)text {
  return [GREYActions grey_actionForTypeText:text atUITextPosition:nil];
}

+ (id<GREYAction>)actionForClearText {
  Class webElement = NSClassFromString(@"WebAccessibilityObjectWrapper");
  id<GREYMatcher> constraints = grey_anyOf(grey_respondsToSelector(@selector(text)),
                                           grey_kindOfClass(webElement),
                                           nil);
  return [GREYActionBlock actionWithName:@"Clear text"
                             constraints:constraints
                            performBlock:^BOOL (id element, __strong NSError **errorOrNil) {
    NSString *textStr;
    // If we're dealing with a text field in a web view, we need to use JS to get the text value.
    if ([element isKindOfClass:webElement]) {
      // Input tags can be identified by having the 'title' attribute set, or current value.
      // Associating a <label> tag to the input tag does NOT result in an iOS accessibility element.
      NSString *xPathResultType = @"XPathResult.FIRST_ORDERED_NODE_TYPE";
      NSString *xPathForTitle =
          [NSString stringWithFormat:@"//input[@title=\"%@\" or @value=\"%@\"]",
              [element accessibilityLabel], [element accessibilityLabel]];
      NSString *jsForTitle = [[NSString alloc] initWithFormat:
          @"document.evaluate('%@', document, null, %@, null).singleNodeValue.value = '';",
          xPathForTitle,
          xPathResultType];
      UIWebView *parentWebView = (UIWebView *)[element grey_viewContainingSelf];
      textStr = [parentWebView stringByEvaluatingJavaScriptFromString:jsForTitle];
    } else {
      textStr = [element text];
    }

    NSMutableString *deleteStr = [[NSMutableString alloc] init];
    for (NSUInteger i = 0; i < textStr.length; i++) {
      [deleteStr appendString:@"\b"];
    }

    if (deleteStr.length == 0) {
      return YES;
    } else if ([element conformsToProtocol:@protocol(UITextInput)]) {
      id<GREYAction> typeAtEnd = [GREYActions grey_actionForTypeText:deleteStr
                                                    atUITextPosition:[element endOfDocument]];
      return [typeAtEnd perform:element error:errorOrNil];
    } else {
      return [[GREYActions actionForTypeText:deleteStr] perform:element error:errorOrNil];
    }
  }];
}

+ (id<GREYAction>)actionForSetDate:(NSDate *)date {
  id<GREYMatcher> constraints = grey_allOf(grey_interactable(),
                                           grey_not(grey_systemAlertViewShown()),
                                           grey_kindOfClass([UIDatePicker class]),
                                           nil);
  return [[GREYActionBlock alloc] initWithName:[NSString stringWithFormat:@"Set date to %@", date]
                                   constraints:constraints
                                  performBlock:^BOOL (UIDatePicker *datePicker,
                                                      __strong NSError **errorOrNil) {
    NSDate *previousDate = [datePicker date];
    [datePicker setDate:date animated:YES];
    // Changing the data programmatically does not fire the "value changed" events,
    // So we have to trigger the events manually if the value changes.
    if (![date isEqualToDate:previousDate]) {
      [datePicker sendActionsForControlEvents:UIControlEventValueChanged];
    }
    return YES;
  }];
}

+ (id<GREYAction>)actionForSetPickerColumn:(NSInteger)column toValue:(NSString *)value {
  return [[GREYPickerAction alloc] initWithColumn:column value:value];
}

+ (id<GREYAction>)actionForJavaScriptExecution:(NSString *)js
                                        output:(out __strong NSString **)outResult {
  // TODO: JS Errors should be propagated up.
  id<GREYMatcher> constraints = grey_allOf(grey_not(grey_systemAlertViewShown()),
                                           grey_kindOfClass([UIWebView class]),
                                           nil);
  return [[GREYActionBlock alloc] initWithName:@"Execute JavaScript"
                                   constraints:constraints
                                  performBlock:^BOOL (UIWebView *webView,
                                                      __strong NSError **errorOrNil) {
    if (outResult) {
      *outResult = [webView stringByEvaluatingJavaScriptFromString:js];
    } else {
      [webView stringByEvaluatingJavaScriptFromString:js];
    }
    // TODO: Delay should be removed once webview sync is stable.
    [[GREYUIThreadExecutor sharedInstance] drainForTime:0.5];  // Wait for actions to register.
    return YES;
  }];
}

+ (id<GREYAction>)actionForSnapshot:(out __strong UIImage **)outImage {
  NSParameterAssert(outImage);

  return [[GREYActionBlock alloc] initWithName:@"Element Snapshot"
                                   constraints:nil
                                  performBlock:^BOOL (id element, __strong NSError **errorOrNil) {
    UIImage *snapshot = [GREYScreenshotUtil snapshotElement:element];
    if (snapshot == nil) {
      [NSError grey_logOrSetOutReferenceIfNonNil:errorOrNil
                                      withDomain:kGREYInteractionErrorDomain
                                            code:kGREYInteractionActionFailedErrorCode
                            andDescriptionFormat:@"Failed to take snapshot. Snapshot is nil."];
      return NO;
    } else {
      *outImage = snapshot;
      return YES;
    }
  }];
}

#pragma mark - Private

/**
 *  Use the iOS keyboard to type a string starting from the provided UITextPosition. If the
 *  position is @c nil, then type text from the text input's current position. Should only be called
 *  with a position if element conforms to the UITextInput protocol - which it should if you
 *  derived the UITextPosition from the element.
 *
 *  @param text     The text to be typed.
 *  @param position The position in the text field at which the text is to be typed.
 *
 *  @return @c YES if the action succeeded, else @c NO. If an action returns @c NO, it does not
 *          mean that the action was not performed at all but somewhere during the action execution
 *          the error occured and so the UI may be in an unrecoverable state.
 */
+ (id<GREYAction>)grey_actionForTypeText:(NSString *)text
                        atUITextPosition:(UITextPosition *)position {
  return [GREYActionBlock actionWithName:[NSString stringWithFormat:@"Type \"%@\"", text]
                             constraints:grey_not(grey_systemAlertViewShown())
                            performBlock:^BOOL (id element, __strong NSError **errorOrNil) {
    UIView *expectedFirstResponderView;
    if (![element isKindOfClass:[UIView class]]) {
      expectedFirstResponderView = [element grey_viewContainingSelf];
    } else {
      expectedFirstResponderView = element;
    }

    // If expectedFirstResponderView or one of its ancestors isn't the first responder, tap on
    // it so it becomes the first responder.
    if (![expectedFirstResponderView isFirstResponder] &&
        ![grey_ancestor(grey_firstResponder()) matches:expectedFirstResponderView]) {
      // Tap on the element to make expectedFirstResponderView a first responder.
      if (![[GREYActions actionForTap] perform:element error:errorOrNil]) {
        return NO;
      }
      // Wait for keyboard to show up and any other UI changes to take effect.
      if (![GREYKeyboard waitForKeyboardToAppear]) {
        NSString *description = @"Keyboard did not appear after tapping on %@. Are you sure that "
            @"tapping on this element will bring up the keyboard?";
        [NSError grey_logOrSetOutReferenceIfNonNil:errorOrNil
                                        withDomain:kGREYInteractionErrorDomain
                                              code:kGREYInteractionActionFailedErrorCode
                              andDescriptionFormat:description, element];
        return NO;
      }
    }

    // If a position is given, move the text cursor to that position.
    id firstResponder = [[expectedFirstResponderView window] firstResponder];
    if (position) {
      if ([firstResponder conformsToProtocol:@protocol(UITextInput)]) {
        UITextRange *newRange = [firstResponder textRangeFromPosition:position toPosition:position];
        [firstResponder setSelectedTextRange:newRange];
      } else {
        NSString *description = @"First Responder %@ of element %@ does not conform to UITextInput"
            @" protocol.";
        [NSError grey_logOrSetOutReferenceIfNonNil:errorOrNil
                                        withDomain:kGREYInteractionErrorDomain
                                              code:kGREYInteractionActionFailedErrorCode
                              andDescriptionFormat:description,
                                                   firstResponder,
                                                   expectedFirstResponderView];
        return NO;
      }
    }

    BOOL retVal;

    if (iOS8_2_OR_ABOVE()) {
      // Directly perform the typing since for iOS8.2 and above, we directly turn off Autocorrect
      // and Predictive Typing from the settings.
      retVal = [self grey_withAutocorrectAlreadyDisabledTypeText:text
                                                inFirstResponder:firstResponder
                                                       withError:errorOrNil];
    } else {
      // Perform typing. If this is pre-iOS8.2, then we simply turn the autocorrection
      // off the current textfield being typed in.
      retVal = [self grey_disableAutoCorrectForDelegateAndTypeText:text
                                                  inFirstResponder:firstResponder
                                                         withError:errorOrNil];
    }

    return retVal;
  }];
}

/**
 *  Performs typing in the provided element by turning off autocorrect. In case of OS versions
 *  that provide an easy API to turn off autocorrect from the settings, we do that, else we obtain
 *  the element being typed in, and turn off autocorrect for that element while being typed on.
 *
 *  @param      text           The text to be typed.
 *  @param      firstResponder The element the action is to be performed on.
 *                             This must not be @c nil.
 *  @param[out] errorOrNil     Error that will be populated on failure. The implementing class
 *                             should handle the behavior when it is @c nil by, for example,
 *                             logging the error or throwing an exception.
 *
 *  @return @c YES if the action succeeded, else @c NO. If an action returns @c NO, it does not
 *          mean that the action was not performed at all but somewhere during the action execution
 *          the error occured and so the UI may be in an unrecoverable state.
 */
+ (BOOL)grey_disableAutoCorrectForDelegateAndTypeText:(NSString *)text
                                     inFirstResponder:(id)firstResponder
                                            withError:(__strong NSError **)errorOrNil {
  // If you're clearing the text label or if the first responder does not have an
  // autocorrectionType option then you do not need to have the autocorrect turned off.
  NSCharacterSet *set = [NSCharacterSet characterSetWithCharactersInString:@"\b"];
  if ([text stringByTrimmingCharactersInSet:set].length == 0 ||
      ![firstResponder respondsToSelector:@selector(autocorrectionType)]) {
    return [GREYKeyboard typeString:text
                   inFirstResponder:firstResponder
                              error:errorOrNil];
  }

  // Obtain the current delegate from the keyboard. This can only be called when the keyboard is
  // up. The original delegate has to be passed here in order to change the autocorrection type
  // since we reset the delegate in the grey_setAutocorrectionType:forIntance:
  // withOriginalKeyboardDelegate:withKeyboardToggling method in order for the autocorrection type
  // change to take effect.
  id keyboardInstance = [UIKeyboardImpl sharedInstance];
  id originalKeyboardDelegate = [keyboardInstance delegate];
  UITextAutocorrectionType originalAutoCorrectionType =
      [originalKeyboardDelegate autocorrectionType];
  // For a copy of the keyboard's delegate, turn the autocorrection off. Set this copy back
  // as the delegate.
  [self grey_setAutocorrectionType:UITextAutocorrectionTypeNo
                       forInstance:keyboardInstance
      withOriginalKeyboardDelegate:originalKeyboardDelegate
              withKeyboardToggling:iOS8_1_OR_ABOVE()];

  // Type the string in the delegate text field.
  BOOL typingResult = [GREYKeyboard typeString:text
                              inFirstResponder:firstResponder
                                         error:errorOrNil];

  // Reset the keyboard delegate's autocorrection back to the original one.
  [self grey_setAutocorrectionType:originalAutoCorrectionType
                       forInstance:keyboardInstance
      withOriginalKeyboardDelegate:originalKeyboardDelegate
              withKeyboardToggling:NO];
  return typingResult;
}

/**
 *  For the particular element being typed in, signified by the delegate of the keyboard instance
 *  turn off autocorrection. To provide a delay in this action, we can also hide and show the
 *  keyboard.
 *
 *  @param autoCorrectionType         The autocorrection type to set the current keyboard to.
 *  @param keyboardInstance           The active keyboard instance.
 *  @param toggleKeyboardVisibilityOn A switch to show/hide the keyboard.
 *
 */
+ (void)grey_setAutocorrectionType:(BOOL)autoCorrectionType
                       forInstance:(id)keyboardInstance
      withOriginalKeyboardDelegate:(id)keyboardDelegate
              withKeyboardToggling:(BOOL)toggleKeyboardVisibilityOn {
  if (toggleKeyboardVisibilityOn) {
    [keyboardInstance hideKeyboard];
  }
  [keyboardDelegate setAutocorrectionType:autoCorrectionType];
  [keyboardInstance setDelegate:keyboardDelegate];
  if (toggleKeyboardVisibilityOn) {
    [keyboardInstance showKeyboard];
  }
}

/**
 *  Directly perform typing without any changes in the first responder element whatsoever.
 *
 *  @param      text           The text to be typed.
 *  @param      firstResponder The element the action is to be performed on.
 *                             This must not be @c nil.
 *  @param[out] errorOrNil     Error that will be populated on failure. The implementing class
 *                             should handle the behavior when it is @c nil by, for example,
 *                             logging the error or throwing an exception.
 *
 *  @return @c YES if the action succeeded, else @c NO. If an action returns @c NO, it does not
 *          mean that the action was not performed at all but somewhere during the action execution
 *          the error occured and so the UI may be in an unrecoverable state.
 */
+ (BOOL)grey_withAutocorrectAlreadyDisabledTypeText:(NSString *)text
                                   inFirstResponder:firstResponder
                                          withError:(__strong NSError **)errorOrNil {
  // Perform typing. This requires autocorrect to be turned off. In
  // the case of iOS8+, this is done through the Keyboard Settings bundle.
  return [GREYKeyboard typeString:text inFirstResponder:firstResponder error:errorOrNil];
}

@end

#if !(GREY_DISABLE_SHORTHAND)

id<GREYAction> grey_doubleTap(void) {
  return [GREYActions actionForMultipleTapsWithCount:2];
}

id<GREYAction> grey_multipleTapsWithCount(NSUInteger count) {
  return [GREYActions actionForMultipleTapsWithCount:count];
}

id<GREYAction> grey_longPress(void) {
  return [GREYActions actionForLongPress];
}

id<GREYAction> grey_longPressWithDuration(CFTimeInterval duration) {
  return [GREYActions actionForLongPressWithDuration:duration];
}

id<GREYAction> grey_longPressAtPointWithDuration(CGPoint point, CFTimeInterval duration) {
  return [GREYActions actionForLongPressAtPoint:point duration:duration];
}

id<GREYAction> grey_scrollInDirection(GREYDirection direction, CGFloat amount) {
  return [GREYActions actionForScrollInDirection:direction amount:amount];
}

id<GREYAction> grey_scrollInDirectionWithStartPoint(GREYDirection direction,
                                                    CGFloat amount,
                                                    CGFloat xOriginStartPercentage,
                                                    CGFloat yOriginStartPercentage) {
  return [GREYActions actionForScrollInDirection:direction
                                          amount:amount
                          xOriginStartPercentage:xOriginStartPercentage
                          yOriginStartPercentage:yOriginStartPercentage];
}

id<GREYAction> grey_scrollToContentEdge(GREYContentEdge edge) {
  return [GREYActions actionForScrollToContentEdge:edge];
}

id<GREYAction> grey_scrollToContentEdgeWithStartPoint(GREYContentEdge edge,
                                                      CGFloat xOriginStartPercentage,
                                                      CGFloat yOriginStartPercentage) {
  return [GREYActions actionForScrollToContentEdge:edge
                            xOriginStartPercentage:xOriginStartPercentage
                            yOriginStartPercentage:yOriginStartPercentage];
}

id<GREYAction> grey_swipeFastInDirection(GREYDirection direction) {
  return [GREYActions actionForSwipeFastInDirection:direction];
}

id<GREYAction> grey_swipeSlowInDirection(GREYDirection direction) {
  return [GREYActions actionForSwipeSlowInDirection:direction];
}

id<GREYAction> grey_swipeFastInDirectionWithStartPoint(GREYDirection direction,
                                                       CGFloat xOriginStartPercentage,
                                                       CGFloat yOriginStartPercentage) {
  return [GREYActions actionForSwipeFastInDirection:direction
                             xOriginStartPercentage:xOriginStartPercentage
                             yOriginStartPercentage:yOriginStartPercentage];
}

id<GREYAction> grey_swipeSlowInDirectionWithStartPoint(GREYDirection direction,
                                                       CGFloat xOriginStartPercentage,
                                                       CGFloat yOriginStartPercentage) {
  return [GREYActions actionForSwipeSlowInDirection:direction
                             xOriginStartPercentage:xOriginStartPercentage
                             yOriginStartPercentage:yOriginStartPercentage];
}

id<GREYAction> grey_moveSliderToValue(float value) {
  return [GREYActions actionForMoveSliderToValue:value];
}

id<GREYAction> grey_setStepperValue(double value) {
  return [GREYActions actionForSetStepperValue:value];
}

id<GREYAction> grey_tap(void) {
  return [GREYActions actionForTap];
}

id<GREYAction> grey_tapAtPoint(CGPoint point) {
  return [GREYActions actionForTapAtPoint:point];
}

id<GREYAction> grey_typeText(NSString *text) {
  return [GREYActions actionForTypeText:text];
}

id<GREYAction> grey_clearText(void) {
  return [GREYActions actionForClearText];
}

id<GREYAction> grey_turnSwitchOn(BOOL on) {
  return [GREYActions actionForTurnSwitchOn:on];
}

id<GREYAction> grey_setDate(NSDate *date) {
  return [GREYActions actionForSetDate:date];
}

id<GREYAction> grey_setPickerColumnToValue(NSInteger column, NSString *value) {
  return [GREYActions actionForSetPickerColumn:column toValue:value];
}

id<GREYAction> grey_javaScriptExecution(NSString *js, __strong NSString **outResult) {
  return [GREYActions actionForJavaScriptExecution:js output:outResult];
}

id<GREYAction> grey_snapshot(__strong UIImage **outImage) {
  return [GREYActions actionForSnapshot:outImage];
}

#endif // GREY_DISABLE_SHORTHAND
