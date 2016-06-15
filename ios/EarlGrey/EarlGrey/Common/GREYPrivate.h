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
 *  @file GREYPrivate.h
 *  @brief Exposes EarlGrey's interfaces and methods that are otherwise private.
 */

#import <EarlGrey/GREYAppStateTracker.h>
#import <EarlGrey/GREYAssertions.h>
#import <EarlGrey/GREYElementInteraction.h>
#import <EarlGrey/GREYScreenshotUtil.h>
#import <EarlGrey/GREYUIThreadExecutor.h>
#import <EarlGrey/GREYVisibilityChecker.h>

@protocol GREYIdlingResource, GREYMatcher;

@interface GREYUIThreadExecutor (GREYPrivate)

- (void)registerIdlingResource:(id<GREYIdlingResource>)resource;
- (void)deregisterIdlingResource:(id<GREYIdlingResource>)resource;

@end

@interface NSObject (GREYPrivate)

- (void)greyswizzled_performSelector:(SEL)aSelector
                          withObject:(id)anArgument
                          afterDelay:(NSTimeInterval)delay
                             inModes:(NSArray *)modes;
@end

@interface GREYAssertions (GREYPrivate)

+ (id<GREYAssertion>)grey_createAssertionWithMatcher:(id<GREYMatcher>)matcher;

@end

@interface GREYElementInteraction (GREYPrivate)

- (NSArray *)matchedElementsWithTimeout:(NSTimeInterval)timeout error:(__strong NSError **)error;

@end

@interface GREYAppStateTracker (GREYPrivate)

- (void)grey_clearState;

@end

@interface UIWebView (GREYPrivate)

- (void)grey_clearPendingInteraction;
- (void)grey_pendingInteractionForTime:(NSTimeInterval)seconds;
- (void)grey_trackAJAXLoading;
- (void)grey_untrackAJAXLoading;
- (void)grey_setIsLoadingFrame:(BOOL)loading;
- (BOOL)grey_isLoadingFrame;

@end

@interface NSURLConnection (GREYPrivate)

- (void)grey_trackPending;
- (void)grey_untrackPending;

@end

@interface GREYScreenshotUtil (GREYPrivate)

+ (UIImage *)grey_takeScreenshotAfterScreenUpdates:(BOOL)afterScreenUpdates;

@end

@interface GREYVisibilityChecker (GREYPrivate)

+ (UIImage *)grey_lastActualBeforeImage;
+ (UIImage *)grey_lastActualAfterImage;
+ (UIImage *)grey_lastExpectedAfterImage;

@end
