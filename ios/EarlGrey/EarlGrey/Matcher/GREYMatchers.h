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

#import <EarlGrey/GREYConstants.h>
#import <EarlGrey/GREYDefines.h>
#import <Foundation/Foundation.h>

@protocol GREYMatcher;

/**
 *  EarlGrey matchers for UI elements.
 */
@interface GREYMatchers : NSObject

/**
 *  Matcher for application's key window.
 *
 *  @return A matcher for the application's key window.
 */
+ (id<GREYMatcher>)matcherForKeyWindow;

/**
 *  Matcher for UI element with the provided accessibility @c label.
 *
 *  @param label The accessibility label to be matched.
 *
 *  @return A matcher for the accessibility label of an accessible element.
 */
+ (id<GREYMatcher>)matcherForAccessibilityLabel:(NSString *)label;

/**
 *  Matcher for UI element with the provided accessibility ID @c accessibilityID.
 *
 *  @param accessibilityID The accessibility ID to be matched.
 *
 *  @return A matcher for the accessibility ID of an accessible element.
 */
+ (id<GREYMatcher>)matcherForAccessibilityID:(NSString *)accessibilityID;

/**
 *  Matcher for UI element with the provided accessibility @c value.
 *
 *  @param value The accessibility value to be matched.
 *
 *  @return A matcher for the accessibility value of an accessible element.
 */
+ (id<GREYMatcher>)matcherForAccessibilityValue:(NSString *)value;

/**
 *  Matcher for UI element with the provided accessibility @c traits.
 *
 *  @param traits The accessibility traits to be matched.
 *
 *  @return A matcher for the accessibility traits of an accessible element.
 *
 */
+ (id<GREYMatcher>)matcherForAccessibilityTraits:(UIAccessibilityTraits)traits;

/**
 *  Matcher for UI element with the provided accessiblity @c hint.
 *
 *  @param hint The accessibility hint to be matched.
 *
 *  @return A matcher for the accessibility hint of an accessible element.
 */
+ (id<GREYMatcher>)matcherForAccessibilityHint:(NSString *)hint;

/**
 *  Matcher for UI elements of type UIButton, UILabel, UITextField or UITextView displaying the
 *  provided @c inputText.
 *
 *  @param text The text to be matched in the UI elements.
 *
 *  @return A matcher to check for any UI elements with a text field containing the given text.
 */
+ (id<GREYMatcher>)matcherForText:(NSString *)text;

/**
 *  Matcher for element that is the first responder.
 *
 *  @return A matcher that verifies if a UI element is the first responder.
 */
+ (id<GREYMatcher>)matcherForFirstResponder;

/**
 *  Matcher to check if system alert view is shown.
 *
 *  @return A matcher to check if a system alert view is being shown.
 */
+ (id<GREYMatcher>)matcherForSystemAlertViewShown;

/**
 *  Matcher for UI element whose percent visible area (of its accessibility frame) exceeds the
 *  given @c percent.
 *
 *  @param percent The percent visible area that the UI element being matched has to be visible.
 *                 Allowed values for @c percent are [0,1] inclusive.
 *
 *  @return A matcher that checks if a UI element has a visible area at least equal
 *          to a minimum value.
 */
+ (id<GREYMatcher>)matcherForMinimumVisiblePercent:(CGFloat)percent;

/**
 *  Matcher for UI element that is sufficiently visible to the user. EarlGrey considers elements
 *  with visible area percentage greater than @c kElementSufficientlyVisiblePercentage (0.75)
 *  to be sufficiently visible.
 *
 *  @return A matcher intialized with a visibility percentage that confirms an element is
 *          sufficiently visible.
 */
+ (id<GREYMatcher>)matcherForSufficientlyVisible;

/**
 *  Matcher for UI element that are not visible to the user i.e. has a zero visible area.
 *
 *  @return A matcher for verifying if an element is not visible.
 */
+ (id<GREYMatcher>)matcherForNotVisible;

/**
 *  Matcher for UI element that matches EarlGrey's criteria for user interaction currently it must
 *  satisfy at least the following criteria:
 *  <ul>
 *    <li>At least a few pixels of the element's UI are visible.</li>
 *    <li>The element's accessibility activation point OR the center of the element's visible area
 *        is visible.</li>
 *  </ul>
 *
 *  @return A matcher that checks if a UI element is interactable.
 */
+ (id<GREYMatcher>)matcherForInteractable;

/**
 *  Matcher to check if a UI element is accessible.
 *
 *  @return A matcher that checks if a UI element is accessible.
 */
+ (id<GREYMatcher>)matcherForAccessibilityElement;

/**
 *  Matcher for views that are subclass of the provided @c klass.
 *
 *  @param klass A UIView class or subclass.
 *
 *  @return A matcher that confirms if the given class is a subview of the provided class.
 */
+ (id<GREYMatcher>)matcherForKindOfClass:(Class)klass;

/**
 *  Matcher for matching UIProgressView's values. Use greaterThan, greaterThanOrEqualTo,
 *  lessThan etc to create @c comparisonMatcher. For example, to match the UIProgressView
 *  elements that have progress value greater than 50.2, use
 *  @code [GREYMatchers matcherForProgress:grey_greaterThan(@(50.2))] @endcode. In case if an
 *  unimplemented matcher is required, please implement it similar to @c grey_closeTo.
 *
 *  @param comparisonMatcher The matcher with the value to check the progress against.
 *
 *  @return A matcher for checking a UIProgessView's value.
 */
+ (id<GREYMatcher>)matcherForProgress:(id<GREYMatcher>)comparisonMatcher;

/**
 *  Matcher for UI element that respond to the provided @c sel.
 *
 *  @param sel The selector to be responded to.
 *
 *  @return A matcher to check if a UI element's class responds to a particular selector.
 */
+ (id<GREYMatcher>)matcherForRespondsToSelector:(SEL)sel;

/**
 *  Matcher for UI element that conform to the provided @c protocol.
 *
 *  @param protocol The protocol that the UI element must conform to.
 *
 *  @return A matcher to check if a UI element's class confirms to a particular protocol.
 */
+ (id<GREYMatcher>)matcherForConformsToProtocol:(Protocol *)protocol;

/**
 *  Matcher that matches UI element based on the presence of an ancestor in its hierarchy.
 *  The given matcher is used to match decendants.
 *
 *  @param ancestorMatcher The ancestor UI element whose descendants are to be matched.
 *
 *  @return A matcher to check if a UI element is the descendant of another.
 */
+ (id<GREYMatcher>)matcherForAncestor:(id<GREYMatcher>)ancestorMatcher;

/**
 *  Matcher that matches any UI element with a descendant matching the given matcher.
 *
 *  @param descendantMatcher A matcher being checked to be a descendant
 *                           of the UI element being checked.
 *
 *  @return A matcher to check if a the specified element is in a descendant of another UI element.
 */
+ (id<GREYMatcher>)matcherForDescendant:(id<GREYMatcher>)descendantMatcher;

/**
 *  Matcher that matches UIButton that has title label as @c text.
 *
 *  @param title The title to be checked on the UIButtons being matched.
 *
 *  @return A matcher to confirm UIButton titles.
 */
+ (id<GREYMatcher>)matcherForButtonTitle:(NSString *)title;

/**
 *  Matcher that matches UIStepper with value as @c value.
 *
 *  @param value A value that the UIStepper should be checked for.
 *
 *  @return A matcher for checking UIStepper values.
 */
+ (id<GREYMatcher>)matcherForStepperValue:(double)value;

/**
 *  Matcher that matches a UISlider's value.
 *
 *  @param valueMatcher A matcher for the UISlider's value. You must provide a valid
 *                      @c valueMatcher for the floating point value comparison. The
 *                      @c valueMatcher should be of the type @c closeTo, @c greaterThan,
 *                      @c lessThan, @c lessThanOrEqualTo, @c greaterThanOrEqualTo. The
 *                      value matchers should account for any loss in precision for the given
 *                      floating point value. If you are using @c grey_closeTo, use delta diff as
 *                      @c kGREYAcceptableFloatDifference. In case if an unimplemented matcher
 *                      is required, please implement it similar to @c grey_closeTo.
 *
 *  @return A matcher for checking a UISlider's value.
 */
+ (id<GREYMatcher>)matcherForSliderValueMatcher:(id<GREYMatcher>)valueMatcher;

/**
 *  Matcher that matches UIPickerView that has a column set to @c value.
 *
 *  @param column The column of the UIPickerView to be matched.
 *  @param value  The value that should be set in the column of the UIPickerView.
 *
 *  @return A matcher to check the value in a particular column of a UIPickerView.
 */
+ (id<GREYMatcher>)matcherForPickerColumn:(NSInteger)column setToValue:(NSString *)value;

/**
 *  Matcher that matches UIDatePicker that is set to @c value.
 *
 *  @param value The date value that should be present in the UIDatePicker
 *
 *  @return A matcher for a date in a UIDatePicker.
 */
+ (id<GREYMatcher>)matcherForDatePickerValue:(NSDate *)value;

/**
 *  Matcher that verifies whether an element, that is a UIControl, is enabled.
 *
 *  @return A matcher for checking whether a UI element is an enabled UIControl.
 */
+ (id<GREYMatcher>)matcherForEnabledElement;

/**
 *  Matcher that verifies whether a view has its userInteractionEnabled property set to @c YES.
 *
 *  @return A matcher for checking whether a view' userInteractionEnabled property is set to @c YES.
 */
+ (id<GREYMatcher>)matcherForUserInteractionEnabled;

/**
 *  Matcher that verifies that the selected element satisfies the given constraints to the
 *  reference element.
 *  Usage:
 *  @code
 *  GREYLayoutConstraint *constraint1 = [GREYLayoutConstraint layoutConstraintWithAttribute ... ];
 *  GREYLayoutConstraint *constraint2 = [GREYLayoutConstraint layoutConstraintForDirection ... ];
 *  id<GREYMatcher> *matcher = [GREYMatcher matcherForConstraints:@[ constraint1, constraint2 ]
 *                                toReferenceElementMatching:aReferenceElementMatcher];
 *  [EarlGrey selectElementWithMatcher ...] assertWithMatcher:matcher];
 *  @endcode
 *
 *  @param constraints             The constraints to be matched.
 *  @param referenceElementMatcher The reference element with the correct constraints.
 *
 *  @return A matcher to verify the GREYLayoutConstraints on a UI element.
 */
+ (id<GREYMatcher>)matcherForConstraints:(NSArray *)constraints
            toReferenceElementMatching:(id<GREYMatcher>)referenceElementMatcher;

/**
 *  Matcher primarily for asserting that the element is @c nil or not found.
 *
 *  @return A matcher to check if a specified element is @c nil or not found.
 */
+ (id<GREYMatcher>)matcherForNil;

/**
 *  Matcher for asserting that the element exists in the UI hierarchy (i.e. not @c nil).
 *
 *  @return A matcher to check if a specified element is not @c nil.
 */
+ (id<GREYMatcher>)matcherForNotNil;

/**
 *  Matcher for toggling the switch control.
 *
 *  @param on The state of the switch control. The switch control is in ON state if @c on is @c YES
 *            or OFF state if @c on is NO.
 *
 *  @return A matcher to check if a UISwitch is on or off.
 */
+ (id<GREYMatcher>)matcherForSwitchWithOnState:(BOOL)on;

/**
 *  A Matcher for NSNumbers that matches when the examined number is within a specified @c delta
 *  from the specified value.
 *
 *  @param value The expected value of the number being matched.
 *
 *  @param delta The delta within which matches are allowed
 *
 *  @return A matcher that checks if a number is close to a specified @c value.
 */
+ (id<GREYMatcher>)matcherForCloseTo:(double)value delta:(double)delta;

/**
 *  A Matcher that matches against any object, including @c nils.
 *
 *  @return A matcher that matches any object.
 */
+ (id<GREYMatcher>)matcherForAnything;

/**
 *  A Matcher that checks if a provided object is equal to the specified @c value. The equality is
 *  determined by calling the @c isEqual: method of the object being examined. In case the @c
 *  value is @c nil, then the object itself is checked to be @c nil.
 *
 *  @param object The object to be checked for equality. Please ensure that scalar values are
 *                passed in as boxed (object) values.
 *
 *  @return A matcher that checks if an object is equal to the provided one.
 */
+ (id<GREYMatcher>)matcherForEqualTo:(id)value;

/**
 *  A Matcher that checks if a provided object is less than a specified @c value. The comparison
 *  is made by calling the @c compare: method of the object being examined.
 *
 *  @param value The value to be compared, which should return @c NSOrderedDescending. Please
 *               ensure that scalar values are passed in as boxed (object) values.
 *
 *  @return A matcher that checks an object is lesser than another provided @c value.
 */
+ (id<GREYMatcher>)matcherForLessThan:(id)value;

/**
 *  A Matcher that checks if a provided object is greater than a specified @c value. The comparison
 *  is made by calling the @c compare: method of the object being examined.
 *
 *  @param value The value to be compared, which should return @c NSOrderedAscending. Please
 *               ensure that scalar values are passed in as boxed (object) values.
 *
 *  @return A matcher that checks an object is greater than another provided @c value.
 */
+ (id<GREYMatcher>)matcherForGreaterThan:(id)value;

@end

#if !(GREY_DISABLE_SHORTHAND)

/** Shorthand for GREYMatchers::matcherForKeyWindow. */
GREY_EXPORT id<GREYMatcher> grey_keyWindow(void);

/** Shorthand for GREYMatchers::matcherForAccessibilityLabel:. */
GREY_EXPORT id<GREYMatcher> grey_accessibilityLabel(NSString *label);

/** Shorthand for GREYMatchers::matcherForAccessibilityID:. */
GREY_EXPORT id<GREYMatcher> grey_accessibilityID(NSString *accessibilityID);

/** Shorthand for GREYMatchers::matcherForAccessibilityValue:. */
GREY_EXPORT id<GREYMatcher> grey_accessibilityValue(NSString *grey_accessibilityValue);

/** Shorthand for GREYMatchers::matcherForAccessibilityTraits:. */
GREY_EXPORT id<GREYMatcher> grey_accessibilityTrait(UIAccessibilityTraits traits);

/** Shorthand for GREYMatchers::matcherForAccessibilityHint:. */
GREY_EXPORT id<GREYMatcher> grey_accessibilityHint(NSString *hint);

/** Shorthand for GREYMatchers::matcherForText:. */
GREY_EXPORT id<GREYMatcher> grey_text(NSString *inputText);

/** Shorthand for GREYMatchers::matcherForFirstResponder. */
GREY_EXPORT id<GREYMatcher> grey_firstResponder(void);

/** Shorthand for GREYMatchers::matcherForSystemAlertViewShown. */
GREY_EXPORT id<GREYMatcher> grey_systemAlertViewShown(void);

/** Shorthand for GREYMatchers::matcherForMinimumVisiblePercent:. */
GREY_EXPORT id<GREYMatcher> grey_minimumVisiblePercent(CGFloat percent);

/** Shorthand for GREYMatchers::matcherForSufficientlyVisible. */
GREY_EXPORT id<GREYMatcher> grey_sufficientlyVisible(void);

/** Shorthand for GREYMatchers::matcherForInteractable. */
GREY_EXPORT id<GREYMatcher> grey_interactable(void);

/** Shorthand for GREYMatchers::matcherForNotVisible. */
GREY_EXPORT id<GREYMatcher> grey_notVisible(void);

/** Shorthand for GREYMatchers::matcherForAccessibilityElement. */
GREY_EXPORT id<GREYMatcher> grey_accessibilityElement(void);

/** Shorthand for GREYMatchers::matcherForKindOfClass:. */
GREY_EXPORT id<GREYMatcher> grey_kindOfClass(Class klass);

/** Shorthand for GREYMatchers::matcherForProgress:. */
GREY_EXPORT id<GREYMatcher> grey_progress(id<GREYMatcher> comparisonMatcher);

/** Shorthand for GREYMatchers::matcherForRespondsToSelector:. */
GREY_EXPORT id<GREYMatcher> grey_respondsToSelector(SEL sel);

/** Shorthand for GREYMatchers::matcherForConformsToProtocol:. */
GREY_EXPORT id<GREYMatcher> grey_conformsToProtocol(Protocol *protocol);

/** Shorthand for GREYMatchers::matcherForAncestor:. */
GREY_EXPORT id<GREYMatcher> grey_ancestor(id<GREYMatcher> ancestorMatcher);

/** Shorthand for GREYMatchers::matcherForDescendant:. */
GREY_EXPORT id<GREYMatcher> grey_descendant(id<GREYMatcher> descendantMatcher);

/** Shorthand for GREYMatchers::matcherForButtonTitle:. */
GREY_EXPORT id<GREYMatcher> grey_buttonTitle(NSString *text);

/** Shorthand for GREYMatchers::matcherForStepperValue:. */
GREY_EXPORT id<GREYMatcher> grey_stepperValue(double value);

/** Shorthand for GREYMatchers::matcherForSliderValueMatcher:. */
GREY_EXPORT id<GREYMatcher> grey_sliderValueMatcher(id<GREYMatcher> valueMatcher);

/** Shorthand for GREYMatchers::matcherForPickerColumn:setToValue:. */
GREY_EXPORT id<GREYMatcher> grey_pickerColumnSetToValue(NSInteger column, NSString *value);

/** Shorthand for GREYMatchers::matcherForDatePickerValue:. */
GREY_EXPORT id<GREYMatcher> grey_datePickerValue(NSDate *date);

/** Shorthand for GREYMatchers::matcherForEnabledElement. */
GREY_EXPORT id<GREYMatcher> grey_enabled(void);

/** Shorthand for GREYMatchers::matcherForUserInteractionEnabled. */
GREY_EXPORT id<GREYMatcher> grey_userInteractionEnabled(void);

/** Shorthand for GREYMatchers::matcherForConstraints:toReferenceElementMatching:. */
GREY_EXPORT id<GREYMatcher> grey_layout(NSArray *constraints,
                                        id<GREYMatcher> referenceElementMatcher);

/** Shorthand for GREYMatchers::matcherForNil. */
GREY_EXPORT id<GREYMatcher> grey_nil(void);

/** Shorthand for GREYMatchers::matcherForNotNil. */
GREY_EXPORT id<GREYMatcher> grey_notNil(void);

/** Shorthand for GREYMatchers::matcherForSwitchWithOnState:. */
GREY_EXPORT id<GREYMatcher> grey_switchWithOnState(BOOL on);

/** Shorthand for GREYMatchers::matcherForCloseTo:delta. */
GREY_EXPORT id<GREYMatcher> grey_closeTo(double value, double delta);

/** Shorthand for GREYMatchers::matcherForAnything. */
GREY_EXPORT id<GREYMatcher> grey_anything(void);

/** Shorthand for GREYMatchers::matcherForEqualTo:object. */
GREY_EXPORT id<GREYMatcher> grey_equalTo(id value);

/** Shorthand for GREYMatchers::matcherForLessThan:value. */
GREY_EXPORT id<GREYMatcher> grey_lessThan(id value);

/** Shorthand for GREYMatchers::matcherForGreaterThan:value. */
GREY_EXPORT id<GREYMatcher> grey_greaterThan(id value);

#endif // GREY_DISABLE_SHORTHAND
