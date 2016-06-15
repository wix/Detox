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

#import <EarlGrey/GREYDefines.h>
#import <Foundation/Foundation.h>

@protocol GREYInteractionDataSource;
@protocol GREYAction;
@protocol GREYAssertion;
@protocol GREYMatcher;

/**
 *  Error domain for element interaction failures.
 */
GREY_EXTERN NSString *const kGREYInteractionErrorDomain;

/**
 *  Error codes for element interaction failures.
 */
typedef NS_ENUM(NSInteger, GREYInteractionErrorCode){
  /**
   *  Element search has failed.
   */
  kGREYInteractionElementNotFoundErrorCode = 0,
  /**
   *  Action execution has failed.
   */
  kGREYInteractionActionFailedErrorCode,
  /**
   *  Assertion execution has failed.
   */
  kGREYInteractionAssertionFailedErrorCode,
  /**
   *  Timeout reached before interaction could be performed.
   */
  kGREYInteractionTimeoutErrorCode,
  /**
   *  Single element search found multiple elements.
   */
  kGREYInteractionMultipleElementsMatchedErrorCode,
};

/**
 *  Notification name for when an action will be performed. The action itself is contained in the
 *  @c userInfo object from the @c notification and can be obtained using the key
 *  @c kGREYActionUserInfoKey.
 */
GREY_EXTERN NSString *const kGREYWillPerformActionNotification;

/**
 *  Notification name for when an action has been performed. The action itself is contained in the
 *  @c userInfo object from the @c notification and can be obtained using the key
 *  @c kGREYActionUserInfoKey.
 */
GREY_EXTERN NSString *const kGREYDidPerformActionNotification;

/**
 *  Notification name for when an assertion will be checked. The assertion itself is contained in
 *  the @c userInfo object from the @c notification and can be obtained using the key
 *  @c kGREYAssertionUserInfoKey.
 */
GREY_EXTERN NSString *const kGREYWillPerformAssertionNotification;

/**
 *  Notification name for when an assertion has been performed. The assertion itself is contained
 *  in the @c userInfo object from the @c notification and can be obtained using the key
 *  @c kGREYAssertionUserInfoKey.
 */
GREY_EXTERN NSString *const kGREYDidPerformAssertionNotification;

/**
 *  User Info dictionary key for the action performed.
 */
GREY_EXTERN NSString *const kGREYActionUserInfoKey;

/**
 *  User Info dictionary key for the element an action was performed on. The element for an
 *  assertion can be @c nil in case of an error.
 */
GREY_EXTERN NSString *const kGREYActionElementUserInfoKey;

/**
 *  User Info dictionary key for any error populated on the action being performed.
 */
GREY_EXTERN NSString *const kGREYActionErrorUserInfoKey;

/**
 *  User Info dictionary key for the assertion checked.
 */
GREY_EXTERN NSString *const kGREYAssertionUserInfoKey;

/**
 *  User Info dictionary key for the element an assertion was checked on. The element for an
 *  assertion can be @c nil since assertions can be performed on @c nil elements.
 */
GREY_EXTERN NSString *const kGREYAssertionElementUserInfoKey;

/**
 *  User Info dictionary key for any error populated on the assertion being checked.
 */
GREY_EXTERN NSString *const kGREYAssertionErrorUserInfoKey;

/**
 *  Represents an interaction with a UI element.
 */
@protocol GREYInteraction<NSObject>

/**
 *  Data source for providing UI elements to interact with.
 *  The dataSource must adopt GREYInteractionDataSource protocol and a weak reference is held.
 */
@property(nonatomic, weak) id<GREYInteractionDataSource> dataSource;

/**
 *  Indicates that the current interaction should be performed on a UI element contained inside
 *  another UI element that is uniquely matched by @c rootMatcher.
 *
 *  @param rootMatcher Matcher used to select the container of the element the interaction
 *                     will be performed on.
 *
 *  @return The provided GREYInteraction instance, with an appropriate rootMatcher.
 */
- (instancetype)inRoot:(id<GREYMatcher>)rootMatcher;

/**
 *  Performs the @c action repeatedly on the the element matching the @c matcher until the element
 *  to interact with (specified by GREYInteraction::selectElementWithMatcher:) is found or a
 *  timeout occurs. The search action is only performed when coupled with
 *  GREYInteraction::performAction:, GREYInteraction::assert:, or
 *  GREYInteraction::assertWithMatcher: APIs.
 *
 *  @param action  The action to be performed on the element.
 *  @param matcher The matcher that the element matches.
 *
 *  @return The provided GREYInteraction instance, with an appropriate action and matcher.
 */
- (instancetype)usingSearchAction:(id<GREYAction>)action
             onElementWithMatcher:(id<GREYMatcher>)matcher;

/**
 *  Performs an @c action on the selected UI element.
 *
 *  @param action The action to be performed on the @c element.
 *  @throws NSException if the action fails.
 *
 *  @return The provided GREYInteraction instance with an appropriate action.
 */
- (instancetype)performAction:(id<GREYAction>)action;

/**
 *  Performs an @c action on the selected UI element with an error set on failure.
 *
 *  @param action          The action to be performed on the @c element.
 *  @param[out] errorOrNil Error populated on failure.
 *  @throws NSException on action failure if @c errorOrNil is not set.
 *
 *  @return The provided GREYInteraction instance, with an action and an error that will be
 *          populated on failure.
 */
- (instancetype)performAction:(id<GREYAction>)action error:(__strong NSError **)errorOrNil;

/**
 *  Performs an @c assertion on the selected UI element.
 *
 *  @param assertion The assertion to be performed on the @c element.
 *  @throws NSException if the @c assertion fails.
 *
 *  @return The provided GREYInteraction instance with a valid assertion.
 */
- (instancetype)assert:(id<GREYAssertion>)assertion;

/**
 *  Performs an @c assertion on the selected UI element with an error set on failure.
 *
 *  @param assertion       The assertion to be performed on the @c element.
 *  @param[out] errorOrNil Error populated on failure.
 *  @throws NSException on assertion failure if @c errorOrNil is not set.
 *
 *  @return The provided GREYInteraction instance with an assertion and an error that will be
 *          populated on failure.
 */
- (instancetype)assert:(id<GREYAssertion>)assertion error:(__strong NSError **)errorOrNil;

/**
 *  Performs an assertion that evaluates @c matcher on the selected UI element.
 *
 *  @param matcher The matcher to be evaluated on the @c element.
 *
 *  @return The provided GREYInteraction instance with a matcher to be evaluated on an element.
 */
- (instancetype)assertWithMatcher:(id<GREYMatcher>)matcher;

/**
 *  Performs an assertion that evaluates @c matcher on the selected UI element.
 *
 *  @param matcher         The matcher to be evaluated on the @c element.
 *  @param[out] errorOrNil Error populated on failure.
 *  @throws NSException on assertion failure if @c errorOrNil is not set.
 *
 *  @return The provided GREYInteraction instance, with a matcher to be evaluated on an element and
 *          an error that will be populated on failure.
 */
- (instancetype)assertWithMatcher:(id<GREYMatcher>)matcher error:(__strong NSError **)errorOrNil;

@end
