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

#import "EarlGrey.h"

#include <pthread.h>

#import "Additions/XCTestCase+GREYAdditions.h"
#import "Common/GREYAnalytics.h"
#import "Common/GREYConfiguration.h"
#import "Common/GREYDefines.h"
#import "Common/GREYExposed.h"
#import "Core/GREYAutomationSetup.h"
#import "Core/GREYKeyboard.h"
#import "Event/GREYSyntheticEvents.h"
#import "Exception/GREYDefaultFailureHandler.h"
#import "Synchronization/GREYUIThreadExecutor.h"

// Handler for all EarlGrey failures.
id<GREYFailureHandler> greyFailureHandler;

// Lock to guard access to @c greyFailureHandler.
static pthread_mutex_t gFailureHandlerLock = PTHREAD_RECURSIVE_MUTEX_INITIALIZER;

@implementation EarlGreyImpl {
  // Invocation should be tracked on next teardown.
  BOOL _makeAnalyticsCallOnTearDown;
}

+ (void)load {
  @autoreleasepool {
    // These need to be set in load since someone might call GREYAssertXXX APIs without calling
    // into EarlGrey.
    greyFailureHandler = [[GREYDefaultFailureHandler alloc] init];
    // Prepare for automation.
    [[GREYAutomationSetup sharedInstance] perform];
  }
}

+ (instancetype)invokedFromFile:(NSString *)fileName lineNumber:(NSUInteger)lineNumber {
  static EarlGreyImpl *instance = nil;
  static dispatch_once_t token = 0;
  dispatch_once(&token, ^{
    instance = [[EarlGreyImpl alloc] initOnce];
  });

  if ([greyFailureHandler respondsToSelector:@selector(setInvocationFile:andInvocationLine:)]) {
    [greyFailureHandler setInvocationFile:fileName andInvocationLine:lineNumber];
  }
  [instance grey_didInvokeEarlGrey];
  return instance;
}

- (instancetype)initOnce {
  self = [super init];
  if (self) {
    // Add a global observer for all test teardown events.
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(grey_testCaseDidTearDown:)
                                                 name:kGREYXCTestCaseInstanceDidTearDown
                                               object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:kGREYXCTestCaseInstanceDidTearDown
                                                object:nil];
}

- (GREYElementInteraction *)selectElementWithMatcher:(id<GREYMatcher>)elementMatcher {
  return [[GREYElementInteraction alloc] initWithElementMatcher:elementMatcher];
}

- (void)setFailureHandler:(id<GREYFailureHandler>)handler {
  [self grey_lockFailureHandler];
  greyFailureHandler = (handler == nil) ? [[GREYDefaultFailureHandler alloc] init] : handler;
  [self grey_unlockFailureHandler];
}

- (void)handleException:(GREYFrameworkException *)exception details:(NSString *)details {
  [self grey_lockFailureHandler];
  [greyFailureHandler handleException:exception details:details];
  [self grey_unlockFailureHandler];
}

- (BOOL)rotateDeviceToOrientation:(UIDeviceOrientation)deviceOrientation
                       errorOrNil:(__strong NSError **)errorOrNil {
  return [GREYSyntheticEvents rotateDeviceToOrientation:deviceOrientation errorOrNil:errorOrNil];
}

#pragma mark - Private

// Called when any Earlgrey invocation occurs using any @code [EarlGrey XXX] @endcode statements.
- (void)grey_didInvokeEarlGrey {
  if ([XCTestCase grey_currentTestCase]) {
    // Count a hit only if EarlGrey is called within the context of a test case.
    _makeAnalyticsCallOnTearDown = YES;
  }
}

- (void)grey_testCaseDidTearDown:(NSNotification *)note {
  if (_makeAnalyticsCallOnTearDown) {
    if (GREY_CONFIG_BOOL(kGREYConfigKeyAnalyticsEnabled)) {
      [GREYAnalytics trackTestCaseCompletion];
    }
    _makeAnalyticsCallOnTearDown = NO;
  }
}

- (void)grey_lockFailureHandler {
  int lock = pthread_mutex_lock(&gFailureHandlerLock);
  NSAssert(lock == 0, @"Failed to lock.");
}

- (void)grey_unlockFailureHandler {
  int unlock = pthread_mutex_unlock(&gFailureHandlerLock);
  NSAssert(unlock == 0, @"Failed to unlock.");
}

@end
