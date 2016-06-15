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

/**
 * @file
 * @brief Helper macros for performing assertions and throwing assertion failure exceptions.
 */

#ifndef GREY_ASSERTION_DEFINES_H
#define GREY_ASSERTION_DEFINES_H

#import <EarlGrey/GREYDefines.h>
#import <EarlGrey/GREYFailureHandler.h>
#import <EarlGrey/GREYFrameworkException.h>

GREY_EXTERN id<GREYFailureHandler> greyFailureHandler;

#pragma mark - Public

// Safe to call from anywhere within EarlGrey test.

/**
 *  Generates a failure with the provided @c __reason if the expression @c __a1 evaluates to @c NO.
 *
 *  @param __a1     The expression that should be evaluated.
 *  @param __reason The reason for the failure if @c __a1 evaluates to @c NO. May be a format
 *                  string, in which case the varargs will be required.
 *  @param ...      Args used to generate the failure description from the reason string format.
 */
#define GREYAssert(__a1, __reason, ...) \
  I_GREYSetCurrentAsFailable(); \
  I_GREYAssert(__a1, __reason, ##__VA_ARGS__)

/**
 *  Generates a failure with the provided @c __reason if the expression @c __a1 evaluates to @c NO.
 *
 *  @param __a1     The expression that should be evaluated.
 *  @param __reason The reason for the failure if @c __a1 evaluates to @c NO. May be a format
 *                  string, in which case the varargs will be required.
 *  @param ...      Args used to generate the failure description from the reason string format.
 */
#define GREYAssertTrue(__a1, __reason, ...) \
  I_GREYSetCurrentAsFailable(); \
  I_GREYAssertTrue(__a1, __reason, ##__VA_ARGS__)

/**
 *  Generates a failure with the provided @c __reason if the expression @c __a1 evaluates to @c YES.
 *
 *  @param __a1     The expression that should be evaluated.
 *  @param __reason The reason for the failure if @c __a1 evaluates to @c YES. May be a format
 *                  string, in which case the varargs will be required.
 *  @param ...      Args used to generate the failure description from the reason string format.
 */
#define GREYAssertFalse(__a1, __reason, ...) \
  I_GREYSetCurrentAsFailable(); \
  I_GREYAssertFalse(__a1, __reason, ##__VA_ARGS__)

/**
 *  Generates a failure with the provided @c __reason if the expression @c __a1 is @c nil.
 *
 *  @param __a1     The expression that should be evaluated.
 *  @param __reason The reason for the failure if @c __a1 is @c nil. May be a format string,
 *                  in which case the varargs will be required.
 *  @param ...      Args used to generate the failure description from the reason string format.
 */
#define GREYAssertNotNil(__a1, __reason, ...) \
  I_GREYSetCurrentAsFailable(); \
  I_GREYAssertNotNil(__a1, __reason, ##__VA_ARGS__)

/**
 *  Generates a failure with the provided @c __reason if the expression @c __a1 is not @c nil.
 *
 *  @param __a1     The expression that should be evaluated.
 *  @param __reason The reason for the failure if @c __a1 is not @c nil. May be a format
 *                  string, in which case the varargs will be required.
 *  @param ...      Args used to generate the failure description from the reason string format.
 */
#define GREYAssertNil(__a1, __reason, ...) \
  I_GREYSetCurrentAsFailable(); \
  I_GREYAssertNil(__a1, __reason, ##__VA_ARGS__)

/**
 *  Generates a failure with the provided @c __reason if the @c __a1 and @c __a2 are not equal.
 *  @c __a1 and @c __a2 are expected to be of scalar types.
 *
 *  @param __a1     The left hand scalar value on the equality operation.
 *  @param __a2     The right hand scalar value on the equality operation.
 *  @param __reason The reason for the failure if @c __a1 and @c __a2 are not equal. May be a format
 *                  string, in which case the varargs will be required.
 *  @param ...      Args used to generate the failure description from the reason string format.
 */
#define GREYAssertEqual(__a1, __a2, __reason, ...) \
  I_GREYSetCurrentAsFailable(); \
  I_GREYAssertEqual(__a1, __a2, __reason, ##__VA_ARGS__)

/**
 *  Generates a failure unconditionally, with the provided @c __reason.
 *
 *  @param __reason  The reason for the failure. May be a format string, in which case the varargs
 *                   will be required.
 *  @param ...       Parameters used to generate the failure description from the reason string.
 */
#define GREYFail(__reason, ...) \
  I_GREYSetCurrentAsFailable(); \
  I_GREYFail(__reason, ##__VA_ARGS__)

/**
 *  Generates a failure unconditionally, with the provided @c __reason and @c __details.
 *
 *  @param __reason  The reason for the failure.
 *  @param __details The failure details. May be a format string, in which case the varargs will be
 *                   required.
 *  @param ...       Parameters used to generate the failure description from the reason string.
 */
#define GREYFailWithDetails(__reason, __details, ...)  \
  I_GREYSetCurrentAsFailable(); \
  I_GREYFailWithDetails(__reason, __details, ##__VA_ARGS__)

#pragma mark - Private Use By Framework Only

// THESE ARE METHODS TO BE CALLED BY THE FRAMEWORK ONLY.
// DO NOT CALL OUTSIDE FRAMEWORK

/// @cond INTERNAL

#define I_GREYFormattedString(__var, __format, ...) \
  do { \
    /* clang warns us about a leak in formatting but we don't care as we are about to fail. */ \
    _Pragma("clang diagnostic push") \
    _Pragma("clang diagnostic ignored \"-Wformat-nonliteral\"") \
    _Pragma("clang diagnostic ignored \"-Wformat-security\"") \
    __var = [NSString stringWithFormat:__format, ##__VA_ARGS__]; \
    _Pragma("clang diagnostic pop") \
  } while (NO)

#define I_GREYRegisterFailure(__exceptionName, __reason, __details, ...) \
  do { \
    NSString *details__; \
    I_GREYFormattedString(details__, __details, ##__VA_ARGS__); \
    [greyFailureHandler handleException:[GREYFrameworkException exceptionWithName:__exceptionName \
                                                                           reason:__reason] \
                              details:details__]; \
  } while (NO)

// No private macro should call this.
#define I_GREYSetCurrentAsFailable() \
  do { \
    if ([greyFailureHandler respondsToSelector:@selector(setInvocationFile:andInvocationLine:)]) { \
      [greyFailureHandler setInvocationFile:[NSString stringWithUTF8String:__FILE__] \
                          andInvocationLine:__LINE__]; \
    } \
  } while (NO)

#define I_GREYAssert(__a1, __reason, ...) \
  do { \
    if (!(__a1)) { \
      NSString *formattedReason__; \
      I_GREYFormattedString(formattedReason__, __reason, ##__VA_ARGS__); \
      I_GREYRegisterFailure(kGREYAssertionFailedException, formattedReason__, @""); \
    } \
  } while(NO)

#define I_GREYAssertTrue(__a1, __reason, ...) \
  do { \
    if ((__a1) == NO) { \
      NSString *formattedReason__; \
      I_GREYFormattedString(formattedReason__, __reason, ##__VA_ARGS__); \
      I_GREYRegisterFailure(kGREYAssertionFailedException, \
          formattedReason__, \
          @"Expected expression to be True but it was False."); \
    } \
  } while(NO)

#define I_GREYAssertFalse(__a1, __reason, ...) \
  do { \
    if ((__a1) != NO) { \
      NSString *formattedReason__; \
      I_GREYFormattedString(formattedReason__, __reason, ##__VA_ARGS__); \
      I_GREYRegisterFailure(kGREYAssertionFailedException, \
          formattedReason__, \
          @"Expected expression to be False but it was True."); \
    } \
  } while(NO)

#define I_GREYAssertNotNil(__a1, __reason, ...) \
  do { \
    if ((__a1) == nil) { \
      NSString *formattedReason__; \
      I_GREYFormattedString(formattedReason__, __reason, ##__VA_ARGS__); \
      I_GREYRegisterFailure(kGREYNotNilException, formattedReason__, @""); \
    } \
  } while(NO)

#define I_GREYAssertNil(__a1, __reason, ...) \
  do { \
    if ((__a1) != nil) { \
      NSString *formattedReason__; \
      I_GREYFormattedString(formattedReason__, __reason, ##__VA_ARGS__); \
      I_GREYRegisterFailure(kGREYNilException, formattedReason__, @""); \
    } \
  } while(NO)

#define I_GREYAssertEqual(__a1, __a2, __reason, ...) \
  do { \
    if ((__a1) != (__a2)) { \
      NSString *formattedReason__; \
      I_GREYFormattedString(formattedReason__, __reason, ##__VA_ARGS__); \
      I_GREYRegisterFailure(kGREYAssertionFailedException, formattedReason__, @""); \
    } \
  } while(NO)

#define I_GREYFail(__reason, ...) \
  NSString *formattedReason__; \
  I_GREYFormattedString(formattedReason__, __reason, ##__VA_ARGS__); \
  I_GREYRegisterFailure(kGREYGenericFailureException, formattedReason__, @"")

#define I_GREYFailWithDetails(__reason, __details, ...)  \
  I_GREYRegisterFailure(kGREYGenericFailureException, __reason, __details, ##__VA_ARGS__)

#define I_GREYTimeout(__reason, __details, ...) \
  I_GREYRegisterFailure(kGREYTimeoutException, __reason, __details, ##__VA_ARGS__)

#define I_GREYActionFail(__reason, __details, ...) \
  I_GREYRegisterFailure(kGREYActionFailedException, __reason, __details, ##__VA_ARGS__)

#define I_GREYAssertionFail(__reason, __details, ...) \
  I_GREYRegisterFailure(kGREYAssertionFailedException, __reason, __details, ##__VA_ARGS__)

#define I_GREYElementNotFound(__reason, __details, ...) \
  I_GREYRegisterFailure(kGREYNoMatchingElementException, __reason, __details, ##__VA_ARGS__)

#define I_GREYMultipleElementsFound(__reason, __details, ...) \
  I_GREYRegisterFailure(kGREYMultipleElementsFoundException, __reason, __details, ##__VA_ARGS__)

#define I_CHECK_MAIN_THREAD() \
  I_GREYAssert([NSThread isMainThread], @"Must be on the main thread.")

/// @endcond

#endif  // GREY_ASSERTION_DEFINES_H
