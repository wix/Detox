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

#import <Foundation/Foundation.h>

/**
 *  Provides ability to type strings using the iOS system keyboard.
 */
@interface GREYKeyboard : NSObject

/**
 *  Types @c string using the keyboard in the provided @c firstResponder. Keyboard must be shown
 *  on the screen when this method is called.
 *
 *  @param string          Text to be typed using the keyboard.
 *  @param firstResponder  The element that the text is to be typed in.
 *  @param[out] errorOrNil Error populated when any failure occurs during typing. If @c nil, then a
 *                         custom error with @c kGREYInteractionActionFailedErrorCode is logged.
 *
 *  @return @c YES if typing succeeded, @c NO otherwise.
 */
+ (BOOL)typeString:(NSString *)string
    inFirstResponder:(id)firstResponder
               error:(__strong NSError **)errorOrNil;

/**
 *  Waits until the keyboard is visible on the screen.
 *  @return @c YES if the keyboard did appear after the wait, @c NO otherwise.
 */
+ (BOOL)waitForKeyboardToAppear;

/**
 *  Waits until the keyboard is not visible on the screen.
 *  @return @c YES if the keyboard did disaappear after the wait, @c NO otherwise.
 */
+ (BOOL)waitForKeyboardToDisappear;

@end
