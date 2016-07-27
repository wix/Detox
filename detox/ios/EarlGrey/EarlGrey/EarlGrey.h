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
 *  Umbrella public header for the EarlGrey framework.
 *
 *  Instead of importing individual headers, import this header using:
 *  @code
 *    @import EarlGrey;  // if your project uses modules
 *  @endcode
 *    OR if your project doesn't use modules:
 *  @code
 *    #import <EarlGrey/EarlGrey.h>
 *  @endcode
 *
 *  To learn more, check out: http://github.com/google/EarlGrey
 */

#import <EarlGrey/GREYAction.h>
#import <EarlGrey/GREYActionBlock.h>
#import <EarlGrey/GREYActions.h>
#import <EarlGrey/GREYAllOf.h>
#import <EarlGrey/GREYAnyOf.h>
#import <EarlGrey/GREYAssertion.h>
#import <EarlGrey/GREYAssertionBlock.h>
#import <EarlGrey/GREYAssertionDefines.h>
#import <EarlGrey/GREYAssertions.h>
#import <EarlGrey/GREYBaseAction.h>
#import <EarlGrey/GREYBaseMatcher.h>
#import <EarlGrey/GREYCondition.h>
#import <EarlGrey/GREYConfiguration.h>
#import <EarlGrey/GREYConstants.h>
#import <EarlGrey/GREYDataEnumerator.h>
#import <EarlGrey/GREYDefines.h>
#import <EarlGrey/GREYDescription.h>
#import <EarlGrey/GREYDispatchQueueIdlingResource.h>
#import <EarlGrey/GREYElementFinder.h>
#import <EarlGrey/GREYElementHierarchy.h>
#import <EarlGrey/GREYElementInteraction.h>
#import <EarlGrey/GREYElementMatcherBlock.h>
#import <EarlGrey/GREYFailureHandler.h>
#import <EarlGrey/GREYFrameworkException.h>
#import <EarlGrey/GREYIdlingResource.h>
#import <EarlGrey/GREYInteraction.h>
#import <EarlGrey/GREYLayoutConstraint.h>
#import <EarlGrey/GREYMatcher.h>
#import <EarlGrey/GREYMatchers.h>
#import <EarlGrey/GREYNSTimerIdlingResource.h>
#import <EarlGrey/GREYNot.h>
#import <EarlGrey/GREYOperationQueueIdlingResource.h>
#import <EarlGrey/GREYProvider.h>
#import <EarlGrey/GREYScreenshotUtil.h>
#import <EarlGrey/GREYScrollActionError.h>
#import <EarlGrey/GREYSyncAPI.h>
#import <EarlGrey/GREYUIThreadExecutor.h>
#import <Foundation/Foundation.h>

/**
 *  Convenience replacement for every EarlGrey method call with
 *  EarlGreyImpl::invokedFromFile:lineNumber: so it can get the invocation file and line to
 *  report to XCTest on failure.
 */
#define EarlGrey [EarlGreyImpl invokedFromFile:[NSString stringWithUTF8String:__FILE__] \
                                    lineNumber:__LINE__]

/**
 *  Entrypoint to the EarlGrey framework.
 *  Use methods of this class to initiate interaction with any UI element on the screen.
 */
@interface EarlGreyImpl : NSObject

/**
 *  Provides the file name and line number of the code that is calling into EarlGrey.
 *  In case of a failure, the information is used to tell XCTest the exact line which caused
 *  the failure so it can be highlighted in the IDE.
 *
 *  @param fileName   The name of the file where the failing code exists.
 *  @param lineNumber The line number of the failing code.
 *
 *  @return An EarlGreyImpl instance, with details of the code invoking EarlGrey.
 */
+ (instancetype)invokedFromFile:(NSString *)fileName lineNumber:(NSUInteger)lineNumber;

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  Starts an interaction with a single UI element of the application.
 *
 *  The interaction will start on the UI element that matches the specified
 *  @c elementMatcher. Interation will fail when multiple elements are matched and
 *  @c elementMatcher should be refined to match a single element.
 *
 *  By default, EarlGrey looks at all the windows from front to back and
 *  searches for the UI element. To focus on a specific window or container, use
 *  GREYElementInteraction::inRoot:.
 *
 *  For example, this code will match a UI element with accessibility identifier "foo"
 *  that is inside FooWindow :
 *      @code
 *      [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"foo")]
 *          inRoot:grey_kindOfClass([FooWindow class])]
 *      @endcode
 *
 *  @param elementMatcher The matcher specifying the UI element that will be targeted by the
 *                        interaction.
 *
 *  @return A GREYElementInteraction instance, initialized with an appropriate matcher.
 */
- (GREYElementInteraction *)selectElementWithMatcher:(id<GREYMatcher>)elementMatcher;

/**
 *  Sets the global failure handler for all framework related failures.
 *
 *  A default failure handler is provided by the framework and it is @b strongly advised to use
 *  that if you don't need to customize error handling in your test. Passing in @c nil will revert
 *  the failure handler to default framework provided failure handler.
 *
 *  @param handler The failure handler to be used for all test failures.
 */
- (void)setFailureHandler:(id<GREYFailureHandler>)handler;

/**
 *  Convenience wrapper to invoke GREYFailureHandler::handleException:details: on the global
 *  failure handler.
 *
 *  @param exception The exception to be handled.
 *  @param details   Any extra details about the failure.
 */
- (void)handleException:(GREYFrameworkException *)exception details:(NSString *)details;

/**
 *  Rotate the device to a given @c deviceOrientation. All device orientations except for
 *  @c UIDeviceOrientationUnknown are supported. If a non-nil @c errorOrNil is provided, it will
 *  be populated with the failure reason if the orientation change fails, otherwise a test failure
 *  will be registered.
 *
 *  @param      deviceOrientation The desired orientation of the device.
 *  @param[out] errorOrNil        Error that will be populated on failure. If @c nil, a test
 *                                failure will be reported if the rotation attempt fails.
 *
 *  @return @c YES if the rotation was successful, @c NO otherwise.
 */
- (BOOL)rotateDeviceToOrientation:(UIDeviceOrientation)deviceOrientation
                       errorOrNil:(__strong NSError **)errorOrNil;

@end
