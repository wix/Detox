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

#import "Core/GREYKeyboard.h"

#include <objc/runtime.h>

#import "Action/GREYTapAction.h"
#import "Additions/NSError+GREYAdditions.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYDefines.h"
#import "Common/GREYExposed.h"
#import "Core/GREYInteraction.h"
#import "Synchronization/GREYAppStateTracker.h"
#import "Synchronization/GREYCondition.h"
#import "Synchronization/GREYUIThreadExecutor.h"

/**
 *  Action for tapping a keyboard key.
 */
static GREYTapAction *gTapKeyAction;

/**
 *  Flag set to @c YES when the keyboard is shown, @c NO when keyboard is hidden.
 */
static BOOL gIsKeyboardShown = NO;

/**
 *  A character set for all alphabets present on a keyboard.
 */
static NSMutableCharacterSet *gAlphabeticKeyplaneCharacters;

/**
 *  Possible accessibility label values for the Shift Key.
 */
static NSArray *gShiftKeyLabels;

/**
 *  Accessibility labels for text modification keys, like shift, delete etc.
 */
static NSDictionary *modifierKeyIdentifierMapping;

/**
 *  A retry time interval in which we re-tap the shift key to ensure
 *  the alphabetic keyplane changed.
 */
static const NSTimeInterval kMaxShiftKeyToggleDuration = 3.0;

/**
 * Time to wait for the keyboard to appear or disappear.
 */
static const NSTimeInterval kKeyboardWillAppearOrDisappearTimeout = 10.0;

/**
 *  Identifier for characters that signify a space key.
 */
static NSString *const kSpaceKeyIdentifier = @" ";

/**
 *  Identifier for characters that signify a delete key.
 */
static NSString *const kDeleteKeyIdentifier = @"\b";

/**
 *  Identifier for characters that signify a return key.
 */
static NSString *const kReturnKeyIdentifier = @"\n";

@implementation GREYKeyboard : NSObject

+ (void)load {
  @autoreleasepool {
    gTapKeyAction = [[GREYTapAction alloc] initWithType:kGREYTapTypeKBKey];
    NSObject *keyboardObject = [[NSObject alloc] init];
    // Note: more, numbers label must be after shift and SHIFT labels, because it is also used for
    // the key for switching between keyplanes.
    gShiftKeyLabels =
        @[ @"shift", @"Shift", @"SHIFT", @"more, symbols", @"more, numbers", @"more", @"MORE" ];

    gAlphabeticKeyplaneCharacters = [NSMutableCharacterSet uppercaseLetterCharacterSet];
    [gAlphabeticKeyplaneCharacters formUnionWithCharacterSet:
        [NSCharacterSet lowercaseLetterCharacterSet]];

    modifierKeyIdentifierMapping = @{
      kSpaceKeyIdentifier : @"space",
      kDeleteKeyIdentifier : @"delete",
      kReturnKeyIdentifier : @"return"
    };

    static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

    // Hooks to keyboard lifecycle notification.
    NSNotificationCenter *defaultNotificationCenter = [NSNotificationCenter defaultCenter];
    [defaultNotificationCenter addObserverForName:UIKeyboardWillShowNotification
                                           object:nil
                                            queue:nil
                                       usingBlock:^(NSNotification *note) {
      NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingKeyboardTransition, keyboardObject);
      objc_setAssociatedObject(keyboardObject,
                               kStateTrackerElementIDKey,
                               elementID,
                               OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }];
    [defaultNotificationCenter addObserverForName:UIKeyboardDidShowNotification
                                           object:nil
                                            queue:nil
                                       usingBlock:^(NSNotification *note) {
      NSString *elementID = objc_getAssociatedObject(keyboardObject, kStateTrackerElementIDKey);
      UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingKeyboardTransition, elementID);
      gIsKeyboardShown = YES;
    }];
    [defaultNotificationCenter addObserverForName:UIKeyboardWillHideNotification
                                           object:nil
                                            queue:nil
                                       usingBlock:^(NSNotification *note) {
      gIsKeyboardShown = NO;
      NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingKeyboardTransition, keyboardObject);
      objc_setAssociatedObject(keyboardObject,
                               kStateTrackerElementIDKey,
                               elementID,
                               OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }];
    [defaultNotificationCenter addObserverForName:UIKeyboardDidHideNotification
                                           object:nil
                                            queue:nil
                                       usingBlock:^(NSNotification *note) {
      NSString *elementID = objc_getAssociatedObject(keyboardObject, kStateTrackerElementIDKey);
      UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingKeyboardTransition, elementID);
    }];
  }
}

+ (BOOL)typeString:(NSString *)string
    inFirstResponder:(id)firstResponder
               error:(__strong NSError **)errorOrNil {
  if ([string length] < 1) {
    [NSError grey_logOrSetOutReferenceIfNonNil:errorOrNil
                                    withDomain:kGREYInteractionErrorDomain
                                          code:kGREYInteractionActionFailedErrorCode
                          andDescriptionFormat:@"Failed to type, because the string provided was"
                                               @" empty."];
    return NO;
  } else if (!gIsKeyboardShown) {
    [NSError grey_logOrSetOutReferenceIfNonNil:errorOrNil
                                    withDomain:kGREYInteractionErrorDomain
                                          code:kGREYInteractionActionFailedErrorCode
                          andDescriptionFormat:@"Failed to type string \"%@\", because keyboard was"
                                               @" not shown on screen.", string];
    return NO;
  }

  __block BOOL success = YES;
  for (NSUInteger i = 0; ((i < string.length) && success); i++) {
    NSString *characterAsString = [NSString stringWithFormat:@"%C", [string characterAtIndex:i]];
    NSLog(@"Attempting to type key %@.", characterAsString);

    id key = [GREYKeyboard grey_findKeyForCharacter:characterAsString];
    // If key is not on the screen, try looking for it on another keyplane.
    if (!key) {
      unichar currentCharacter = [characterAsString characterAtIndex:0];
      if ([gAlphabeticKeyplaneCharacters characterIsMember:currentCharacter]) {
        NSLog(@"Detected an alphabetic key.");
        // Switch to alphabetic keyplane if we are on numbers/symbols keyplane.
        if (![GREYKeyboard grey_isAlphabeticKeyplaneShown]) {
          id moreLettersKey = [GREYKeyboard grey_findKeyForCharacter:@"more, letters"];
          if (!moreLettersKey) {
            return [GREYKeyboard grey_setErrorForkeyNotFoundWithAccessibilityLabel:@"more, letters"
                                                                   forTypingString:string
                                                                             error:errorOrNil];
          }
          [GREYKeyboard grey_tapKey:moreLettersKey];
          key = [GREYKeyboard grey_findKeyForCharacter:characterAsString];
        }
        // If key is not on the current keyplane, use shift to switch to the other one.
        if (!key) {
          key = [GREYKeyboard grey_toggleShiftAndFindKeyWithAccessibilityLabel:characterAsString
                                                                     withError:errorOrNil];
        }
      } else {
        NSLog(@"Detected a non-alphabetic key.");
        // Switch to numbers/symbols keyplane if we are on alphabetic keyplane.
        if ([GREYKeyboard grey_isAlphabeticKeyplaneShown]) {
          id moreNumbersKey = [GREYKeyboard grey_findKeyForCharacter:@"more, numbers"];
          if (!moreNumbersKey) {
            return [GREYKeyboard grey_setErrorForkeyNotFoundWithAccessibilityLabel:@"more, numbers"
                                                                   forTypingString:string
                                                                             error:errorOrNil];
          }
          [GREYKeyboard grey_tapKey:moreNumbersKey];
          key = [GREYKeyboard grey_findKeyForCharacter:characterAsString];
        }
        // If key is not on the current keyplane, use shift to switch to the other one.
        if (!key) {
          if (![GREYKeyboard grey_toggleShiftKeyWithError:errorOrNil]) {
            success = NO;
            break;
          }
          key = [GREYKeyboard grey_findKeyForCharacter:characterAsString];
        }
        // If key is not on either number or symbols keyplane, it could be on alphabetic keyplane.
        // This is the case for @ _ - on UIKeyboardTypeEmailAddress on iPad.
        if (!key) {
          id moreLettersKey = [GREYKeyboard grey_findKeyForCharacter:@"more, letters"];
          if (!moreLettersKey) {
            return [GREYKeyboard grey_setErrorForkeyNotFoundWithAccessibilityLabel:@"more, letters"
                                                                   forTypingString:string
                                                                             error:errorOrNil];
          }
          [GREYKeyboard grey_tapKey:moreLettersKey];
          key = [GREYKeyboard grey_findKeyForCharacter:characterAsString];
        }
      }
      // If key is still not shown on screen, show error message.
      if (!key) {
        return [GREYKeyboard grey_setErrorForkeyNotFoundWithAccessibilityLabel:characterAsString
                                                               forTypingString:string
                                                                         error:errorOrNil];
      }
    }
    // A period key for an email UITextField on iOS9 and above types the email domain (.com, .org)
    // by default. That is not the desired behavior so check below disables it.
    BOOL keyboardTypeWasChangedFromEmailType = NO;
    if (iOS9_OR_ABOVE() &&
        [characterAsString isEqualToString:@"."] &&
        [firstResponder respondsToSelector:@selector(keyboardType)] &&
        [firstResponder keyboardType] == UIKeyboardTypeEmailAddress) {
      [firstResponder setKeyboardType:UIKeyboardTypeDefault];
      keyboardTypeWasChangedFromEmailType = YES;
    }

    // Keyboard was found; this action should always succeed.
    [GREYKeyboard grey_tapKey:key];

    if (keyboardTypeWasChangedFromEmailType) {
      // Set the keyboard type back to the Email Type.
      [firstResponder setKeyboardType:UIKeyboardTypeEmailAddress];
    }
  }
  return success;
}

+ (BOOL)waitForKeyboardToAppear {
  if (gIsKeyboardShown) {
    return YES;
  }
  GREYCondition *keyboardIsShownCondition =
      [[GREYCondition alloc] initWithName:@"Keyboard will appear." block:^BOOL {
        return gIsKeyboardShown;
      }];
  return [keyboardIsShownCondition waitWithTimeout:kKeyboardWillAppearOrDisappearTimeout];
}

+ (BOOL)waitForKeyboardToDisappear {
  if (!gIsKeyboardShown) {
    return YES;
  }
  GREYCondition *keyboardIsNotShownCondition =
      [[GREYCondition alloc] initWithName:@"Keyboard is will disappear." block:^BOOL {
        return !gIsKeyboardShown;
      }];
  return [keyboardIsNotShownCondition waitWithTimeout:kKeyboardWillAppearOrDisappearTimeout];
}


#pragma mark - Private Methods

/**
 *  A utility method to continuously toggle the shift key on an alphabet keyplane until
 *  the correct character case is found.
 *
 *  @param      accessibilityLabel The accessibility label of the key for which
 *                                 the case is being changed.
 *  @param[out] errorOrNil         Error populated on failure.
 *
 *  @return The case toggled key for the accessibility label, or @c nil if it isn't found.
 */
+ (id)grey_toggleShiftAndFindKeyWithAccessibilityLabel:(NSString *)accessibilityLabel
                                           withError:(__strong NSError **)errorOrNil {
  __block id key = nil;
  __block NSError *error;
  GREYCondition *shiftToggleSucceded =
      [GREYCondition conditionWithName:@"Shift key toggled keyplane" block:^BOOL() {
     [GREYKeyboard grey_toggleShiftKeyWithError:&error];
     key = [GREYKeyboard grey_findKeyForCharacter:accessibilityLabel];
     return (key != nil) || (error != nil);
   }];

  BOOL didTimeOut = ![shiftToggleSucceded waitWithTimeout:kMaxShiftKeyToggleDuration];
  if (didTimeOut) {
    [NSError grey_logOrSetOutReferenceIfNonNil:&error
                                    withDomain:kGREYInteractionErrorDomain
                                          code:kGREYInteractionTimeoutErrorCode
                          andDescriptionFormat:@"GREYKeyboard : Shift Key toggling timed out "
                                               @"since key with correct case wasn't found"];
  }

  if (error && errorOrNil) {
    *errorOrNil = error;
  }

  return key;
}

/**
 *  Private API to toggle shift, because tapping on the key was flaky and required a 0.35 second
 *  wait due to accidental touch detection. The 0.35 seconds is the value within which, if a second
 *  tap occurs, then a double tap is registered.
 *
 *  @param[out] errorOrNil Error populated on failure.
 *
 *  @return YES if the shift toggle succeeded, else NO.
 */
+ (BOOL)grey_toggleShiftKeyWithError:(__strong NSError **)errorOrNil {
  NSLog(@"Tapping on Shift key.");
  UIKeyboardImpl *keyboard = [GREYKeyboard grey_keyboardObject];
  // Clear time Shift key was pressed last to make sure the keyboard will not ignore this event.
  // If we do not reset this value, we would need to wait at least 0.35 seconds after toggling
  // Shift before we could reliably toggle it again. This is likely related to the double-tap
  // gesture used for shift-lock (also called caps-lock).
  [[keyboard _layout] setValue:[NSNumber numberWithDouble:0.0] forKey:@"_shiftLockFirstTapTime"];

  for (NSString *shiftKeyLabel in gShiftKeyLabels) {
    id key = [GREYKeyboard grey_findKeyForCharacter:shiftKeyLabel];
    if (key) {
      // Shift key was found; this action should always succeed.
      [GREYKeyboard grey_tapKey:key];
      return YES;
    }
  }
  [NSError grey_logOrSetOutReferenceIfNonNil:errorOrNil
                                  withDomain:kGREYInteractionErrorDomain
                                        code:kGREYInteractionActionFailedErrorCode
                        andDescriptionFormat:@"GREYKeyboard: No known SHIFT key was found in the "
                                             @"hierarchy."];
  return NO;
}

/**
 *  Get the key on the keyboard for a character to be typed.
 *
 *  @param character The character that needs to be typed.
 *
 *  @return A UI element that signifies the key to be tapped for typing action.
 */
+ (id)grey_findKeyForCharacter:(NSString *)character {
  NSParameterAssert(character);
  BOOL ignoreCase = NO;
  NSString *accessibilityLabel = character;
  // If the key is a modifier key then we need to do a case-insensitive comparison and change the
  // accessibility label to the corresponding modifier key accessibility label.
  NSString *modifierKeyIdentifier = [modifierKeyIdentifierMapping objectForKey:character];
  if (modifierKeyIdentifier) {
    // Check for the return key since we can have a different accessibility label
    // depending upon the keyboard.
    UIKeyboardImpl *currentKeyboard = [GREYKeyboard grey_keyboardObject];
    if ([character isEqualToString:kReturnKeyIdentifier]) {
      modifierKeyIdentifier = [currentKeyboard returnKeyDisplayName];
    }
    accessibilityLabel = modifierKeyIdentifier;
    ignoreCase = YES;
  }

  // iOS 9 changes & to ampersand.
  if ([accessibilityLabel isEqualToString:@"&"] && iOS9_OR_ABOVE()) {
    accessibilityLabel = @"ampersand";
  }

  return [self grey_keyWithAccessibilityLabel:accessibilityLabel
          inKeyboardLayoutWithCaseSensitivity:ignoreCase];
}

/**
 *  Get the key on the keyboard for the given accessibility label.
 *
 *  @param accessibilityLabel The accessibility key of the key to be searched.
 *  @param ignoreCase         A Boolean that is @c YES if searching for the key requires ignoring
 *                            the case. This is seen in the case of modifier keys that have
 *                            differing cases across iOS versions.
 *
 *  @return A key that has the given accessibility label.
 */
+ (id)grey_keyWithAccessibilityLabel:(NSString *)accessibilityLabel
      inKeyboardLayoutWithCaseSensitivity:(BOOL)ignoreCase {
  UIKeyboardImpl *keyboard = [GREYKeyboard grey_keyboardObject];
  // Type of layout is private class UIKeyboardLayoutStar, which implements UIAccessibilityContainer
  // Protocol and contains accessibility elements for keyboard keys that it shows on the screen.
  id layout = [keyboard _layout];
  NSAssert(layout, @"Layout instance must not be nil");
  if ([layout accessibilityElementCount] != NSNotFound) {
    for (NSInteger i = 0; i < [layout accessibilityElementCount]; ++i) {
      id key = [layout accessibilityElementAtIndex:i];
      if ((ignoreCase &&
           [[key accessibilityLabel] caseInsensitiveCompare:accessibilityLabel] == NSOrderedSame) ||
          (!ignoreCase && [[key accessibilityLabel] isEqualToString:accessibilityLabel])) {
        return key;
      }
    }
  }
  return nil;
}

/**
 *  A flag to check if the alphabetic keyplan is currently visible on the keyboard.
 *
 *  @return @c YES if the alphabetic keyplan is being shown on the keyboard, else @c NO.
 */
+ (BOOL)grey_isAlphabeticKeyplaneShown {
  // Arbitrarily choose e/E as the key to look for to determine if alphabetic keyplane is shown.
  return [GREYKeyboard grey_findKeyForCharacter:@"e"] != nil
      || [GREYKeyboard grey_findKeyForCharacter:@"E"] != nil;
}

/**
 *  Provides the active keyboard instance.
 *
 *  @return The active UIKeyboardImpl instance.
 */
+ (UIKeyboardImpl *)grey_keyboardObject {
  UIKeyboardImpl *keyboard = [UIKeyboardImpl activeInstance];
  NSAssert(keyboard, @"Keyboard instance must not be nil");
  return keyboard;
}

/**
 *  Utility method to tap on a key on the keyboard.
 *
 *  @param key The key to be tapped.
 */
+ (void)grey_tapKey:(id)key {
  NSParameterAssert(key);

  NSLog(@"Tapping on key: %@.", [key accessibilityLabel]);
  [gTapKeyAction perform:key error:nil];
  [[[GREYKeyboard grey_keyboardObject] taskQueue] waitUntilAllTasksAreFinished];
  [[GREYUIThreadExecutor sharedInstance] drainOnce];
}

/**
 *  Populates or prints an error whenever a key with an accessibility label isn't found during
 *  typing a string.
 *
 *  @param accessibilityLabel The accessibility label of the key
 *  @param string             The string being typed when the key was not found
 *  @param[out] errorOrNil    The error to be populated. If this is @c nil,
 *                            then an error message is logged.
 *
 *  @return NO every time since entering the method means an error has happened.
 */
+ (BOOL)grey_setErrorForkeyNotFoundWithAccessibilityLabel:(NSString *)accessibilityLabel
                                          forTypingString:(NSString *)string
                                                    error:(__strong NSError **)errorOrNil {
  [NSError grey_logOrSetOutReferenceIfNonNil:errorOrNil
                                  withDomain:kGREYInteractionErrorDomain
                                        code:kGREYInteractionElementNotFoundErrorCode
                        andDescriptionFormat:@"Failed to type string \"%@\", because "
                                             @"key '%@' could not be found on the keyboard.",
                                             string, accessibilityLabel];
  return NO;
}

@end
