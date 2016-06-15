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

#import "Core/GREYElementInteraction.h"

#import "Action/GREYAction.h"
#import "Additions/NSError+GREYAdditions.h"
#import "Additions/NSObject+GREYAdditions.h"
#import "Assertion/GREYAssertion.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Assertion/GREYAssertions.h"
#import "Common/GREYConfiguration.h"
#import "Common/GREYDefines.h"
#import "Common/GREYPrivate.h"
#import "Core/GREYElementFinder.h"
#import "Core/GREYInteractionDataSource.h"
#import "Exception/GREYFrameworkException.h"
#import "Matcher/GREYAllOf.h"
#import "Matcher/GREYMatcher.h"
#import "Matcher/GREYMatchers.h"
#import "Provider/GREYElementProvider.h"
#import "Provider/GREYUIWindowProvider.h"
#import "Synchronization/GREYUIThreadExecutor.h"

/**
 *  Extern variable specifying the error domain for GREYElementInteraction.
 */
NSString *const kGREYInteractionErrorDomain = @"com.google.earlgrey.ElementInteractionErrorDomain";
NSString *const kGREYWillPerformActionNotification = @"GREYWillPerformActionNotification";
NSString *const kGREYDidPerformActionNotification = @"GREYDidPerformActionNotification";
NSString *const kGREYWillPerformAssertionNotification = @"GREYWillPerformAssertionNotification";
NSString *const kGREYDidPerformAssertionNotification = @"GREYDidPerformAssertionNotification";

/**
 *  Extern variables specifying the user info keys for any notifications.
 */
NSString *const kGREYActionUserInfoKey = @"kGREYActionUserInfoKey";
NSString *const kGREYActionElementUserInfoKey = @"kGREYActionElementUserInfoKey";
NSString *const kGREYActionErrorUserInfoKey = @"kGREYActionErrorUserInfoKey";
NSString *const kGREYAssertionUserInfoKey = @"kGREYAssertionUserInfoKey";
NSString *const kGREYAssertionElementUserInfoKey = @"kGREYAssertionElementUserInfoKey";
NSString *const kGREYAssertionErrorUserInfoKey = @"kGREYAssertionErrorUserInfoKey";

@interface GREYElementInteraction() <GREYInteractionDataSource>
@end

@implementation GREYElementInteraction {
  id<GREYMatcher> _rootMatcher;
  id<GREYMatcher> _searchActionElementMatcher;
  id<GREYMatcher> _elementMatcher;
  id<GREYAction> _searchAction;
}

@synthesize dataSource;

- (instancetype)initWithElementMatcher:(id<GREYMatcher>)elementMatcher {
  NSParameterAssert(elementMatcher);

  self = [super init];
  if (self) {
    _elementMatcher = elementMatcher;
    [self setDataSource:self];
  }
  return self;
}

- (instancetype)inRoot:(id<GREYMatcher>)rootMatcher {
  _rootMatcher = rootMatcher;
  return self;
}

/**
 *  Searches for UI elements within the root views and returns all matched UI elements. The given
 *  search action is performed until an element is found.
 *
 *  @param timeout The amount of time during which search actions must be performed to find an
 *                 element.
 *  @param error   The error populated on failure. If an element was found and returned when using
 *                 the search actions then any action or timeout errors that happened in the
 *                 previous search are ignored. However, if an element is not found, the error
 *                 will be propagated.
 *
 *  @return An array of matched elements in the data source. If no element is found in @c timeout
 *          seconds, a timeout error will be produced and no elements will be returned.
 */
- (NSArray *)matchedElementsWithTimeout:(NSTimeInterval)timeout error:(__strong NSError **)error {
  NSParameterAssert(error);

  id<GREYInteractionDataSource> strongDataSource = [self dataSource];
  NSAssert(strongDataSource, @"Datasource must be set before fetching UI elements");

  GREYElementProvider *entireRootHierarchyProvider =
      [GREYElementProvider providerWithRootProvider:[strongDataSource rootElementProvider]];
  id<GREYMatcher> elementMatcher = _elementMatcher;
  if (_rootMatcher) {
    elementMatcher = grey_allOf(elementMatcher, grey_ancestor(_rootMatcher), nil);
  }

  GREYElementFinder *elementFinder = [[GREYElementFinder alloc] initWithMatcher:elementMatcher];
  NSError *searchActionError = nil;
  CFTimeInterval timeoutTime = CACurrentMediaTime() + timeout;
  BOOL timedOut = NO;
  while(true) {
    @autoreleasepool {
      // Find the element in the current UI hierarchy.
      NSArray *elements = [elementFinder elementsMatchedInProvider:entireRootHierarchyProvider];
      if (elements.count > 0) {
        return elements;
      } else if (!_searchAction) {
        if (error) {
          *error = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                       code:kGREYInteractionElementNotFoundErrorCode
                                   userInfo:@{ NSLocalizedDescriptionKey : @"No element found." }];
        }
        return nil;
      } else if (searchActionError) {
        break;
      }

      CFTimeInterval currentTime = CACurrentMediaTime();
      if (currentTime >= timeoutTime) {
        timedOut = YES;
        break;
      }
      // Keep applying search action.
      id<GREYInteraction> interaction =
          [[GREYElementInteraction alloc] initWithElementMatcher:_searchActionElementMatcher];
      // Don't fail if this interaction error's out. It might still have revealed the element
      // we're looking for.
      [interaction performAction:_searchAction error:&searchActionError];
      // Drain here so that search at the beginning of the loop looks at stable UI.
      [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
    }
  }

  NSDictionary *userInfo = nil;
  if (searchActionError) {
    userInfo = @{ NSUnderlyingErrorKey : searchActionError };
  } else if (CACurrentMediaTime() >= timeoutTime) {
    CFTimeInterval interactionTimeout =
        GREY_CONFIG_DOUBLE(kGREYConfigKeyInteractionTimeoutDuration);
    NSString *desc = [NSString stringWithFormat:@"Timeout (currently set to %g) occurred when "
                                                @"looking for elements.", interactionTimeout];
    NSError *timeoutError = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                                code:kGREYInteractionTimeoutErrorCode
                                            userInfo:@{ NSLocalizedDescriptionKey : desc }];
    userInfo = @{ NSUnderlyingErrorKey : timeoutError };
  }
  *error = [NSError errorWithDomain:kGREYInteractionErrorDomain
                               code:kGREYInteractionElementNotFoundErrorCode
                           userInfo:userInfo];
  return nil;
}

#pragma mark - GREYInteractionDataSource

/**
 *  Default data source for this interaction if no datasource is set explicitly.
 */
- (id<GREYProvider>)rootElementProvider {
  return [GREYUIWindowProvider providerWithAllWindows];
}

#pragma mark - GREYInteraction

- (instancetype)performAction:(id<GREYAction>)action {
  return [self performAction:action error:nil];
}

- (instancetype)performAction:(id<GREYAction>)action error:(__strong NSError **)errorOrNil {
  NSParameterAssert(action);
  I_CHECK_MAIN_THREAD();

  @autoreleasepool {
    NSError *executorError;
    __block NSError *actionError = nil;
    __weak __typeof__(self) weakSelf = self;

    // Create the user info dictionary for any notificatons and set it up with the action.
    NSMutableDictionary *actionUserInfo = [[NSMutableDictionary alloc] init];
    [actionUserInfo setObject:action forKey:kGREYActionUserInfoKey];
    NSNotificationCenter *defaultNotificationCenter = [NSNotificationCenter defaultCenter];

    CFTimeInterval interactionTimeout =
        GREY_CONFIG_DOUBLE(kGREYConfigKeyInteractionTimeoutDuration);
    [[GREYUIThreadExecutor sharedInstance] executeSyncWithTimeout:interactionTimeout block:^{
      __typeof__(self) strongSelf = weakSelf;
      NSAssert(strongSelf, @"Must not be nil");

      NSArray *elements = [strongSelf matchedElementsWithTimeout:interactionTimeout
                                                           error:&actionError];

      if (elements.count > 1) {
        actionError = [strongSelf grey_errorForMultipleMatchingElements:elements];
      } else {
        id element = [elements firstObject];
        // Notification that the action is to be performed on the found element.
        if (element) {
          [actionUserInfo setObject:element forKey:kGREYActionElementUserInfoKey];
        }
        [defaultNotificationCenter postNotificationName:kGREYWillPerformActionNotification
                                                 object:nil
                                               userInfo:actionUserInfo];

        if (element && ![action perform:element error:&actionError]) {
          // Action didn't succeed yet no error was set.
          if (!actionError) {
            NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : @"No reason provided." };
            actionError = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                              code:kGREYInteractionActionFailedErrorCode
                                          userInfo:userInfo];
          }
          // Add the error obtained from the action to the user info notification dictionary.
          [actionUserInfo setObject:actionError forKey:kGREYActionErrorUserInfoKey];
        }
      }

      // Notification for the action being successfully completed on the found element.
      [defaultNotificationCenter postNotificationName:kGREYDidPerformActionNotification
                                               object:nil
                                             userInfo:actionUserInfo];
      // If we encounter a failure and going to raise an exception, raise it right away before
      // the main runloop drains any further.
      if (actionError && !errorOrNil) {
        [strongSelf grey_handleFailureOfAction:action
                                   actionError:actionError
                          userProvidedOutError:nil];
      }
    } error:&executorError];

    // Failure to execute due to timeout should be represented as interaction timeout.
    if ([executorError.domain isEqualToString:kGREYUIThreadExecutorErrorDomain] &&
        executorError.code == kGREYUIThreadExecutorTimeoutErrorCode) {
      NSString *actionTimeoutDesc =
          [NSString stringWithFormat:@"Failed to execute action within %g seconds.",
                                     interactionTimeout];
      NSDictionary *userInfo = @{
          NSUnderlyingErrorKey : executorError,
          NSLocalizedDescriptionKey : actionTimeoutDesc,
      };
      actionError = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                        code:kGREYInteractionTimeoutErrorCode
                                    userInfo:userInfo];
    }

    if (actionError) {
      [self grey_handleFailureOfAction:action
                           actionError:actionError
                  userProvidedOutError:errorOrNil];
    }

    // Drain once to update idling resources and redraw the screen.
    [[GREYUIThreadExecutor sharedInstance] drainOnce];
  }

  return self;
}

- (instancetype)assert:(id<GREYAssertion>)assertion {
  return [self assert:assertion error:nil];
}

- (instancetype)assert:(id<GREYAssertion>)assertion error:(__strong NSError **)errorOrNil {
  NSParameterAssert(assertion);
  I_CHECK_MAIN_THREAD();

  @autoreleasepool {
    NSError *executorError;
    // An error object that holds error due to element not found (if any). It is used only when
    // an assertion fails because element was nil. That's when we surface this error.
    __block NSError *elementNotFoundError = nil;
    __block NSError *assertionError = nil;
    __weak __typeof__(self) weakSelf = self;

    // Create the user info dictionary for any notificatons and set it up with the assertion.
    NSMutableDictionary *assertionUserInfo = [[NSMutableDictionary alloc] init];
    [assertionUserInfo setObject:assertion forKey:kGREYAssertionUserInfoKey];
    NSNotificationCenter *defaultNotificationCenter = [NSNotificationCenter defaultCenter];

    CGFloat interactionTimeout =
        (CGFloat)GREY_CONFIG_DOUBLE(kGREYConfigKeyInteractionTimeoutDuration);
    [[GREYUIThreadExecutor sharedInstance] executeSyncWithTimeout:interactionTimeout block:^{
      __typeof__(self) strongSelf = weakSelf;
      NSAssert(strongSelf, @"Must not be nil");

      NSArray *elements = [strongSelf matchedElementsWithTimeout:interactionTimeout
                                                           error:&elementNotFoundError];

      if (elements.count > 1) {
        assertionError = [self grey_errorForMultipleMatchingElements:elements];
      } else {
        id element = [elements firstObject];
        // Notification for the assertion to be checked on the found element.
        // We send the notification for an assert even if no element was found.
        if (element) {
          [assertionUserInfo setObject:element forKey:kGREYAssertionElementUserInfoKey];
        }
        [defaultNotificationCenter postNotificationName:kGREYWillPerformAssertionNotification
                                                 object:nil
                                               userInfo:assertionUserInfo];

        if (![assertion assert:element error:&assertionError]) {
          // Assertion didn't succeed yet no error was set.
          if (!assertionError) {
            NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : @"No reason provided." };
            assertionError = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                                 code:kGREYInteractionAssertionFailedErrorCode
                                             userInfo:userInfo];
          }
          // Add the error obtained from the action to the user info notification dictionary.
          [assertionUserInfo setObject:assertionError forKey:kGREYAssertionErrorUserInfoKey];
        }
      }

      // Notification for the action being successfully completed on the found element.
      [defaultNotificationCenter postNotificationName:kGREYDidPerformAssertionNotification
                                               object:nil
                                             userInfo:assertionUserInfo];
      // If we encounter a failure and going to raise an exception, raise it right away before
      // the main runloop drains any further.
      if (assertionError && !errorOrNil) {
        [strongSelf grey_handleFailureOfAssertion:assertion
                                   assertionError:assertionError
                             elementNotFoundError:elementNotFoundError
                             userProvidedOutError:nil];
      }
    } error:&executorError];

    // Failure to execute due to timeout should be represented as interaction timeout.
    if ([executorError.domain isEqualToString:kGREYUIThreadExecutorErrorDomain] &&
        executorError.code == kGREYUIThreadExecutorTimeoutErrorCode) {
      NSString *assertionTimeoutDesc =
          [NSString stringWithFormat:@"Failed to execute assertion within %g seconds.",
                                     interactionTimeout];
      NSDictionary *userInfo = @{
          NSUnderlyingErrorKey : executorError,
          NSLocalizedDescriptionKey : assertionTimeoutDesc,
      };
      assertionError = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                           code:kGREYInteractionTimeoutErrorCode
                                       userInfo:userInfo];
    }

    if (assertionError) {
      [self grey_handleFailureOfAssertion:assertion
                           assertionError:assertionError
                     elementNotFoundError:elementNotFoundError
                     userProvidedOutError:errorOrNil];
    }
  }

  return self;
}

- (instancetype)assertWithMatcher:(id<GREYMatcher>)matcher {
  return [self assert:[GREYAssertions grey_createAssertionWithMatcher:matcher]];
}

- (instancetype)assertWithMatcher:(id<GREYMatcher>)matcher error:(__strong NSError **)errorOrNil {
  return [self assert:[GREYAssertions grey_createAssertionWithMatcher:matcher] error:errorOrNil];
}

- (instancetype)usingSearchAction:(id<GREYAction>)action
             onElementWithMatcher:(id<GREYMatcher>)matcher {
  NSParameterAssert(action);
  NSParameterAssert(matcher);
  _searchActionElementMatcher = matcher;
  _searchAction = action;
  return self;
}

# pragma mark - Private

/**
 *  Handles failure of an @c action.
 *
 *  @param action                 The action that failed.
 *  @param actionError            Contains the reason for failure.
 *  @param[out] userProvidedError The out error (or nil) provided by the user.
 *  @throws NSException to denote the failure of an action, thrown if the @c userProvidedError
 *          is nil on test failure.
 *
 *  @return Junk boolean value to suppress xcode warning to have "a non-void return
 *          value to indicate an error occurred"
 */
- (BOOL)grey_handleFailureOfAction:(id<GREYAction>)action
                     actionError:(NSError *)actionError
            userProvidedOutError:(__strong NSError **)userProvidedError {
  NSParameterAssert(actionError);

  // Throw an exception if userProvidedError isn't provided and the action failed.
  if (!userProvidedError) {
    if ([actionError.domain isEqualToString:kGREYInteractionErrorDomain]) {
      NSString *searchAPIInfo = [self grey_searchActionDescription];

      // Customize exception based on the error.
      switch (actionError.code) {
        case kGREYInteractionElementNotFoundErrorCode: {
          NSString *reason =
              [NSString stringWithFormat:@"Action '%@' was not performed because no UI element "
                                         @"matching %@ was found.", action.name, _elementMatcher];
          I_GREYElementNotFound(reason, @"%@Complete Error: %@", searchAPIInfo, actionError);
          return NO;
        }
        case kGREYInteractionMultipleElementsMatchedErrorCode: {
          NSString *reason =
             [NSString stringWithFormat:@"Action '%@' was not performed because multiple UI "
                                        @"elements matching %@ were found. Use grey_allOf(...) to "
                                        @"create a more specific matcher.",
                                        action.name, _elementMatcher];
          I_GREYMultipleElementsFound(reason, @"%@Complete Error: %@", searchAPIInfo, actionError);
          return NO;
        }
      }
    }

    // TODO: Add unique failure messages for timeout and other well-known reasons.
    NSString *reason = [NSString stringWithFormat:@"Action '%@' failed.", action.name];
    I_GREYActionFail(reason,
                     @"Element matcher: %@\nComplete Error: %@", _elementMatcher, actionError);
  } else {
    *userProvidedError = actionError;
  }

  return NO;
}

/**
 *  Handles failure of an @c assertion.
 *
 *  @param assertion              The asserion that failed.
 *  @param assertionError         Contains the reason for the failure.
 *  @param elementNotFoundError   If non-nil, contains the underlying reason
 *                                for element not being found.
 *  @param[out] userProvidedError Error (or @c nil) provided by the user. When @c nil, an exception
 *                                is thrown to halt further execution of the test case.
 *  @throws NSException to denote an assertion failure, thrown if the @c userProvidedError
 *          is @c nil on test failure.
 *
 *  @return Junk boolean value to suppress xcode warning to have "a non-void return
 *          value to indicate an error occurred"
 */
- (BOOL)grey_handleFailureOfAssertion:(id<GREYAssertion>)assertion
                     assertionError:(NSError *)assertionError
               elementNotFoundError:(NSError *)elementNotFoundError
               userProvidedOutError:(__strong NSError **)userProvidedError {
  NSParameterAssert(assertionError);

  if ([assertionError.domain isEqualToString:kGREYInteractionErrorDomain] &&
      assertionError.code == kGREYInteractionElementNotFoundErrorCode) {
    NSDictionary *userInfo = @{ NSUnderlyingErrorKey : elementNotFoundError };
    assertionError = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                         code:kGREYInteractionElementNotFoundErrorCode
                                     userInfo:userInfo];
  }

  // Throw an exception if userProvidedError isn't provided and the assertion failed.
  if (!userProvidedError) {
    if ([assertionError.domain isEqualToString:kGREYInteractionErrorDomain]) {
      NSString *searchAPIInfo = [self grey_searchActionDescription];

      // Customize exception based on the error.
      switch (assertionError.code) {
        case kGREYInteractionElementNotFoundErrorCode: {
          NSString *reason =
              [NSString stringWithFormat:@"Assertion '%@' was not performed because no UI element "
                                         @"matching %@ was found.",
                                         [assertion name], _elementMatcher];
          I_GREYElementNotFound(reason, @"%@Complete Error: %@", searchAPIInfo, assertionError);
          return NO;
        }
        case kGREYInteractionMultipleElementsMatchedErrorCode: {
          NSString *reason =
              [NSString stringWithFormat:@"Assertion '%@' was not performed because multiple UI "
                                         @"elements matching %@ were found. Use grey_allOf(...) to "
                                         @"create a more specific matcher.",
                                         [assertion name], _elementMatcher];
          I_GREYMultipleElementsFound(reason, @"%@Complete Error: %@",
                                      searchAPIInfo,
                                      assertionError);
          return NO;
        }
      }
    }

    // TODO: Add unique failure messages for timeout and other well-known reason for failure.
    NSString *reason = [NSString stringWithFormat:@"Assertion '%@' failed.", assertion.name];
    I_GREYAssertionFail(reason, @"Element matcher: %@\nComplete Error: %@",
                        _elementMatcher, assertionError);
  } else {
    *userProvidedError = assertionError;
  }

  return NO;
}

/**
 *  Provides an error with @c kGREYInteractionMultipleElementsMatchedErrorCode for multiple elements
 *  matching the specified matcher.
 *
 *  @param matchingElements A set of matching elements
 *
 *  @return Error for matching multiple elements.
 */
- (NSError *)grey_errorForMultipleMatchingElements:(NSArray *)matchingElements {
  NSMutableArray *elementDescriptions =
      [[NSMutableArray alloc] initWithCapacity:matchingElements.count];
  [matchingElements enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    [elementDescriptions addObject:[obj grey_description]];
  }];

  NSString *errorDescription =
      [NSString stringWithFormat:@"Multiple elements were matched: %@. Please use selection "
                                 @"matchers to narrow the selection down to single element.",
                                 elementDescriptions];
  NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : errorDescription };
  return [NSError errorWithDomain:kGREYInteractionErrorDomain
                             code:kGREYInteractionMultipleElementsMatchedErrorCode
                         userInfo:userInfo];
}

/**
 *  @return A String description of the current search action.
 */
- (NSString *)grey_searchActionDescription {
  if (_searchAction) {
    return [NSString stringWithFormat:@"Search action: %@. \nSearch action element matcher: %@.\n",
            _searchAction, _searchActionElementMatcher];
  } else {
    return @"";
  }
}

@end

