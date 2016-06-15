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

#import "Matcher/GREYMatchers.h"

#import <OCHamcrest/OCHamcrest.h>
#include <tgmath.h>

#import "Additions/NSString+GREYAdditions.h"
#import "Additions/UISwitch+GREYAdditions.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYConfiguration.h"
#import "Common/GREYConstants.h"
#import "Common/GREYExposed.h"
#import "Common/GREYPrivate.h"
#import "Common/GREYVisibilityChecker.h"
#import "Core/GREYElementFinder.h"
#import "Core/GREYElementInteraction.h"
#import "Matcher/GREYAllOf.h"
#import "Matcher/GREYAnyOf.h"
#import "Matcher/GREYElementMatcherBlock.h"
#import "Matcher/GREYLayoutConstraint.h"
#import "Matcher/GREYHCMatcher.h"
#import "Matcher/GREYMatcher.h"
#import "Matcher/GREYNot.h"
#import "Provider/GREYElementProvider.h"
#import "Provider/GREYUIWindowProvider.h"

// The minimum percentage of an element's accessibility frame that must be visible before EarlGrey
// considers the element to be sufficiently visible.
static const double kElementSufficientlyVisiblePercentage = 0.75;

@implementation GREYMatchers

+ (id<GREYMatcher>)matcherForKeyWindow {
  MatchesBlock matches = ^BOOL(UIWindow *element) {
    if (element == [UIApplication sharedApplication].keyWindow) {
      return YES;
    }
    return [element isEqual:[UIApplication sharedApplication].keyWindow];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"keyWindow"];
  };
  return grey_allOf(grey_kindOfClass([UIWindow class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForCloseTo:(double)value delta:(double)delta {
  return [[GREYHCMatcher alloc] initWithHCMatcher:HC_closeTo(value, delta)];
}

+ (id<GREYMatcher>)matcherForAnything {
  return [[GREYHCMatcher alloc] initWithHCMatcher:HC_anything()];
}

+ (id<GREYMatcher>)matcherForEqualTo:(id)value {
  return [[GREYHCMatcher alloc] initWithHCMatcher:HC_equalTo(value)];
}

+ (id<GREYMatcher>)matcherForLessThan:(id)value {
  return [[GREYHCMatcher alloc] initWithHCMatcher:HC_lessThan(value)];
}

+ (id<GREYMatcher>)matcherForGreaterThan:(id)value {
  return [[GREYHCMatcher alloc] initWithHCMatcher:HC_greaterThan(value)];
}

+ (id<GREYMatcher>)matcherForAccessibilityLabel:(NSString *)label {
  MatchesBlock matches = ^BOOL(NSObject *element) {
    return [self grey_accessibilityString:element.accessibilityLabel
             isEqualToAccessibilityString:label];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"accessibilityLabel(\"%@\")", label]];
  };
  return grey_allOf(grey_accessibilityElement(),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForAccessibilityID:(NSString *)accessibilityID {
  MatchesBlock matches = ^BOOL(id<UIAccessibilityIdentification> element) {
    if (element.accessibilityIdentifier == accessibilityID) {
      return YES;
    }
    return [element.accessibilityIdentifier isEqualToString:accessibilityID];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"accessibilityID(\"%@\")",
                                                       accessibilityID]];
  };
  return grey_allOf(grey_respondsToSelector(@selector(accessibilityIdentifier)),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForAccessibilityValue:(NSString *)value {
  MatchesBlock matches = ^BOOL(NSObject *element) {
    if (element.accessibilityValue == value) {
      return YES;
    }
    return [self grey_accessibilityString:element.accessibilityValue
             isEqualToAccessibilityString:value];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"accessibilityValue(\"%@\")",
                                                       value]];
  };
  return grey_allOf(grey_accessibilityElement(),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForAccessibilityTraits:(UIAccessibilityTraits)traits {
  MatchesBlock matches = ^BOOL(NSObject *element) {
    return ([element accessibilityTraits] & traits) != 0;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    NSString *traitsString = NSStringFromUIAccessibilityTraits(traits);
    [description appendText:[NSString stringWithFormat:@"accessibilityTraits: %@", traitsString]];
  };
  return grey_allOf(grey_accessibilityElement(),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForAccessibilityHint:(NSString *)hint {
  MatchesBlock matches = ^BOOL(NSObject *element) {
    if (element.accessibilityHint == hint) {
      return YES;
    }
    return [self grey_accessibilityString:element.accessibilityHint
             isEqualToAccessibilityString:hint];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"accessibilityHint(\"%@\")", hint]];
  };
  return grey_allOf(grey_accessibilityElement(),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForText:(NSString *)text {
  return grey_allOf(grey_anyOf(grey_kindOfClass([UILabel class]),
                               grey_kindOfClass([UITextField class]),
                               grey_kindOfClass([UITextView class]), nil),
                    hasProperty(@"text", text), nil);
}

+ (id<GREYMatcher>)matcherForFirstResponder {
  MatchesBlock matches = ^BOOL(UIResponder *element) {
    return [element isFirstResponder];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"firstResponder"];
  };
  return grey_allOf(grey_kindOfClass([UIResponder class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForSystemAlertViewShown {
  MatchesBlock matches = ^BOOL(id element) {
    return [[UIApplication sharedApplication] _isSpringBoardShowingAnAlert];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"isSystemAlertViewShown"];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForMinimumVisiblePercent:(CGFloat)percent {
  NSAssert(percent >= 0.0f && percent <= 1.0f, @"Percent %f must be in the range [0,1]", percent);
  MatchesBlock matches = ^BOOL(UIView *element) {
    return [GREYVisibilityChecker percentVisibleAreaOfElement:element] > percent;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:
        [NSString stringWithFormat:@"matcherForMinimumVisiblePercent(>=%f)", percent]];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForSufficientlyVisible {
  MatchesBlock matches = ^BOOL(UIView *element) {
    return ([GREYVisibilityChecker percentVisibleAreaOfElement:element] >=
            kElementSufficientlyVisiblePercentage);
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:
        [NSString stringWithFormat:@"matcherForSufficientlyVisible(>=%f)",
                                   kElementSufficientlyVisiblePercentage]];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForInteractable {
  MatchesBlock matches = ^BOOL(UIView *element) {
    return [GREYVisibilityChecker isVisibleForInteraction:element];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"interactable"];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForNotVisible {
  MatchesBlock matches = ^BOOL(UIView *element) {
    return [GREYVisibilityChecker isNotVisible:element];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"notVisible"];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForAccessibilityElement {
  MatchesBlock matches = ^BOOL(id element) {
    return [element isAccessibilityElement];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"isAccessibilityElement"];
  };
  return grey_allOf(grey_respondsToSelector(@selector(isAccessibilityElement)),
                  [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                       descriptionBlock:describe],
                  nil);
}

+ (id<GREYMatcher>)matcherForKindOfClass:(Class)klass {
  MatchesBlock matches = ^BOOL(id element) {
    return [element isKindOfClass:klass];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"kindOfClass(\"%@\")",
                                                       NSStringFromClass(klass)]];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForProgress:(id)comparisonMatcher {
  MatchesBlock matches = ^BOOL(UIProgressView *element) {
    return [comparisonMatcher matches:@(element.progress)];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"progressValueThatMatches(\"%@\")",
                                                       comparisonMatcher]];
  };
  return grey_allOf(grey_kindOfClass([UIProgressView class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForRespondsToSelector:(SEL)sel {
  MatchesBlock matches = ^BOOL(id element) {
    return [element respondsToSelector:sel];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"respondsToSelector(%@)",
                                                       NSStringFromSelector(sel)]];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForConformsToProtocol:(Protocol *)protocol {
  MatchesBlock matches = ^BOOL(id element) {
    return [element conformsToProtocol:protocol];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"conformsToProtocol(%@)",
                                                       NSStringFromProtocol(protocol)]];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForAncestor:(id<GREYMatcher>)ancestorMatcher {
  MatchesBlock matches = ^BOOL(id element) {
    id parent = element;
    while (parent) {
      if ([parent isKindOfClass:[UIView class]]) {
        parent = [parent superview];
      } else {
        parent = [parent accessibilityContainer];
      }
      if (parent && [ancestorMatcher matches:parent]) {
        return YES;
      }
    }
    return NO;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"ancestorThatMatches(%@)",
                                ancestorMatcher]];
  };
  return grey_allOf(grey_anyOf(grey_kindOfClass([UIView class]),
                               grey_respondsToSelector(@selector(accessibilityContainer)),
                               nil),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForDescendant:(id<GREYMatcher>)descendantMatcher {
  MatchesBlock matches = ^BOOL(id element) {
    if (element == nil) {
      return NO;
    }

    GREYElementProvider *elementProvider =
        [[GREYElementProvider alloc] initWithRootElements:@[ element ]];
    NSEnumerator *elementEnumerator = [elementProvider dataEnumerator];
    id child;
    while (child = [elementEnumerator nextObject]) {
      if ([descendantMatcher matches:child] && child != element) {
        return YES;
      }
    }
    return NO;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"descendantThatMatches(%@)",
                                descendantMatcher]];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForButtonTitle:(NSString *)title {
  MatchesBlock matches = ^BOOL(UIButton *element) {
    if (element.titleLabel.text == title) {
      return YES;
    }
    return [element.titleLabel.text isEqualToString:title];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"buttonTitle(\"%@\")", title]];
  };
  return grey_allOf(grey_kindOfClass([UIButton class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForSliderValueMatcher:(id<GREYMatcher>)valueMatcher {
  MatchesBlock matches = ^BOOL(UISlider *element) {
    return [valueMatcher matches:@(element.value)];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"sliderValueMatcher:(%@)", valueMatcher]];
  };
  return grey_allOf(grey_kindOfClass([UISlider class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForStepperValue:(double)value {
  MatchesBlock matches = ^BOOL(UIStepper *element) {
    return element.value == value;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"stepperValue(%lf)", value]];
  };
  return grey_allOf(grey_kindOfClass([UIStepper class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForPickerColumn:(NSInteger)column setToValue:(NSString *)value {
  MatchesBlock matches = ^BOOL(UIPickerView *element) {
    if ([element numberOfComponents] < column) {
      return NO;
    }
    NSInteger row = [element selectedRowInComponent:column];
    NSString *rowLabel = [element.delegate pickerView:element
                                          titleForRow:row
                                         forComponent:column];
    if ([rowLabel isEqualToString:value]) {
      return YES;
    } else {
      return NO;
    }
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"pickerColumnAtIndex(%ld) value(\"%@\")",
                                                       (long)column, value]];
  };
  return grey_allOf(grey_kindOfClass([UIPickerView class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForDatePickerValue:(NSDate *)value {
  MatchesBlock matches = ^BOOL(UIDatePicker *element) {
    if (element.date == value) {
      return YES;
    }
    return [element.date isEqualToDate:value];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:[NSString stringWithFormat:@"datePickerWithValue(\"%@\")", value]];
  };
  return grey_allOf(grey_kindOfClass([UIDatePicker class]),
                    [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                         descriptionBlock:describe],
                    nil);
}

+ (id<GREYMatcher>)matcherForEnabledElement {
  MatchesBlock matches = ^BOOL(id element) {
    BOOL matched = YES;
    if ([element isKindOfClass:[UIControl class]]) {
      UIControl *control = (UIControl *)element;
      matched = control.enabled;
    }
    return matched;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"enabled"];
  };
  id<GREYMatcher> isEnabledMatcher =
      [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
  // This basically checks that we don't have any disabled ancestors because checking for enabled
  // ancestor will return the first enabled ancestor even through there might be disabled ancestors.
  id<GREYMatcher> areAncestorsEnabled = grey_not(grey_ancestor(grey_not(isEnabledMatcher)));
  return grey_allOf(isEnabledMatcher, areAncestorsEnabled, nil);
}

+ (id<GREYMatcher>)matcherForUserInteractionEnabled {
  MatchesBlock matches = ^BOOL(UIView *view) {
    return [view isUserInteractionEnabled];
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"userInteractionEnabled"];
  };
  id<GREYMatcher> matcher =
      [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
  return grey_allOf(grey_kindOfClass([UIView class]), matcher, nil);
}

+ (id<GREYMatcher>)matcherForConstraints:(NSArray *)constraints
            toReferenceElementMatching:(id<GREYMatcher>)referenceElementMatcher {
  MatchesBlock matches = ^BOOL(id element) {
    if (!element) {
      // nil elements dont have layout for matching layout constraints.
      return NO;
    }

    // TODO: This causes searching the UI hierarchy multiple times for each element, refactor the
    // design to avoid this.
    GREYElementInteraction *interaction =
        [[GREYElementInteraction alloc] initWithElementMatcher:referenceElementMatcher];
    NSError *matcherError;
    NSArray *referenceElements = [interaction matchedElementsWithTimeout:0 error:&matcherError];
    if (matcherError) {
      I_GREYAssert(NO, @"Error finding element:%@", matcherError);
    } else if (referenceElements.count > 1) {
      I_GREYAssert(NO, @"More than one element matches the reference matcher: %@",
                   referenceElements);
    }

    id referenceElement = [referenceElements firstObject];
    if (!referenceElement) {
      I_GREYAssert(NO, @"Could not find reference element.");
    }

    for (GREYLayoutConstraint *constraint in constraints) {
      if (![constraint satisfiedByElement:element andReferenceElement:referenceElement]) {
        return NO;
      }
    }
    return YES;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    NSString *name =
        [NSString stringWithFormat:@"layoutWithConstraints(%@) referenceElementMatcher:(%@)",
            referenceElementMatcher, [constraints componentsJoinedByString:@","]];
    [description appendText:name];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                              descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForNil {
  MatchesBlock matches = ^BOOL(id element) {
    return element == nil;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"nil"];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForNotNil {
  MatchesBlock matches = ^BOOL(id element) {
    return element != nil;
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    [description appendText:@"notNil"];
  };
  return [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches descriptionBlock:describe];
}

+ (id<GREYMatcher>)matcherForSwitchWithOnState:(BOOL)on {
  MatchesBlock matches = ^BOOL(id element) {
    return ([element isOn] && on) || (![element isOn] && !on);
  };
  DescribeToBlock describe = ^void(id<GREYDescription> description) {
    NSString *name = [NSString stringWithFormat:@"switchInState(%@)",
                         [UISwitch grey_stringFromOnState:on]];
    [description appendText:name];
  };
  id<GREYMatcher> matcher = [[GREYElementMatcherBlock alloc] initWithMatchesBlock:matches
                                                                 descriptionBlock:describe];
  return grey_allOf(grey_respondsToSelector(@selector(isOn)), matcher, nil);
}

#pragma mark - Private Methods

/**
 * @return @c YES if the strings have the same string values, @c NO otherwise.
 */
+ (BOOL)grey_accessibilityString:(id)firstString isEqualToAccessibilityString:(id)secondString {
  if (firstString == secondString) {
    return YES;
  }

  // Beginning in iOS 7, accessibility strings, including accessibilityLabel, accessibilityHint,
  // and accessibilityValue, may be instances of NSAttributedString.  This allows the application
  // developer to control aspects of the spoken output such as pitch and language.
  // NSAttributedString, however, does not inherit from NSString, so a check needs to be performed
  // so the underlying NSString value can be extracted for comparison.
  NSString *firstStringValue;
  if ([firstString isKindOfClass:[NSString class]]) {
    firstStringValue = firstString;
  } else if ([firstString isKindOfClass:[NSAttributedString class]]) {
    firstStringValue = [firstString string];
  } else {
    return NO;
  }

  NSString *secondStringValue;
  if ([secondString isKindOfClass:[NSString class]]) {
    secondStringValue = secondString;
  } else if ([secondString isKindOfClass:[NSAttributedString class]]) {
    secondStringValue = [secondString string];
  } else {
    return NO;
  }

  return [firstStringValue isEqualToString:secondStringValue];
}

@end

#if !(GREY_DISABLE_SHORTHAND)

id<GREYMatcher> grey_keyWindow(void) {
  return [GREYMatchers matcherForKeyWindow];
}

id<GREYMatcher> grey_accessibilityLabel(NSString *label) {
  return [GREYMatchers matcherForAccessibilityLabel:label];
}

id<GREYMatcher> grey_accessibilityID(NSString *accessibilityID) {
  return [GREYMatchers matcherForAccessibilityID:accessibilityID];
}

id<GREYMatcher> grey_accessibilityValue(NSString *value) {
  return [GREYMatchers matcherForAccessibilityValue:value];
}

id<GREYMatcher> grey_accessibilityTrait(UIAccessibilityTraits traits) {
  return [GREYMatchers matcherForAccessibilityTraits:traits];
}

id<GREYMatcher> grey_accessibilityHint(NSString *hint) {
  return [GREYMatchers matcherForAccessibilityHint:hint];
}

id<GREYMatcher> grey_text(NSString *text) {
  return [GREYMatchers matcherForText:text];
}

id<GREYMatcher> grey_firstResponder(void) {
  return [GREYMatchers matcherForFirstResponder];
}

id<GREYMatcher> grey_minimumVisiblePercent(CGFloat percent) {
  return [GREYMatchers matcherForMinimumVisiblePercent:percent];
}

id<GREYMatcher> grey_sufficientlyVisible(void) {
  return [GREYMatchers matcherForSufficientlyVisible];
}

id<GREYMatcher> grey_notVisible(void) {
  return [GREYMatchers matcherForNotVisible];
}

id<GREYMatcher> grey_interactable(void) {
  return [GREYMatchers matcherForInteractable];
}

id<GREYMatcher> grey_accessibilityElement(void) {
  return [GREYMatchers matcherForAccessibilityElement];
}

id<GREYMatcher> grey_kindOfClass(Class klass) {
  return [GREYMatchers matcherForKindOfClass:klass];
}

id<GREYMatcher> grey_progress(id<GREYMatcher> comparisonMatcher) {
  return [GREYMatchers matcherForProgress:comparisonMatcher];
}

id<GREYMatcher> grey_respondsToSelector(SEL sel) {
  return [GREYMatchers matcherForRespondsToSelector:sel];
}

id<GREYMatcher> grey_conformsToProtocol(Protocol *protocol) {
  return [GREYMatchers matcherForConformsToProtocol:protocol];
}

id<GREYMatcher> grey_ancestor(id<GREYMatcher> matcher) {
  return [GREYMatchers matcherForAncestor:matcher];
}

id<GREYMatcher> grey_descendant(id<GREYMatcher> matcher) {
  return [GREYMatchers matcherForDescendant:matcher];
}

id<GREYMatcher> grey_buttonTitle(NSString *text) {
  return [GREYMatchers matcherForButtonTitle:text];
}

id<GREYMatcher> grey_sliderValueMatcher(id<GREYMatcher> valueMatcher) {
  return [GREYMatchers matcherForSliderValueMatcher:valueMatcher];
}

id<GREYMatcher> grey_stepperValue(double value) {
  return [GREYMatchers matcherForStepperValue:value];
}

id<GREYMatcher> grey_pickerColumnSetToValue(NSInteger column, NSString *value) {
  return [GREYMatchers matcherForPickerColumn:column setToValue:value];
}

id<GREYMatcher> grey_systemAlertViewShown(void) {
  return [GREYMatchers matcherForSystemAlertViewShown];
}

id<GREYMatcher> grey_datePickerValue(NSDate *value) {
  return [GREYMatchers matcherForDatePickerValue:value];
}

id<GREYMatcher> grey_enabled(void) {
  return [GREYMatchers matcherForEnabledElement];
}

id<GREYMatcher> grey_userInteractionEnabled(void) {
  return [GREYMatchers matcherForUserInteractionEnabled];
}

id<GREYMatcher> grey_layout(NSArray *constraints, id<GREYMatcher> referenceElementMatcher) {
  return [GREYMatchers matcherForConstraints:constraints
                  toReferenceElementMatching:referenceElementMatcher];
}

id<GREYMatcher> grey_nil(void) {
  return [GREYMatchers matcherForNil];
}

id<GREYMatcher> grey_notNil(void) {
  return [GREYMatchers matcherForNotNil];
}

id<GREYMatcher> grey_switchWithOnState(BOOL on) {
  return [GREYMatchers matcherForSwitchWithOnState:on];
}

id<GREYMatcher> grey_closeTo(double value, double delta) {
  return [GREYMatchers matcherForCloseTo:value delta:delta];
}

id<GREYMatcher> grey_anything(void) {
  return [GREYMatchers matcherForAnything];
}

id<GREYMatcher> grey_equalTo(id value) {
  return [GREYMatchers matcherForEqualTo:value];
}

id<GREYMatcher> grey_lessThan(id value) {
  return [GREYMatchers matcherForLessThan:value];
}

id<GREYMatcher> grey_greaterThan(id value) {
  return [GREYMatchers matcherForGreaterThan:value];
}

#endif // GREY_DISABLE_SHORTHAND

