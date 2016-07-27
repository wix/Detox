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

#import "Additions/NSURLConnection+GREYAdditions.h"

#include <objc/runtime.h>

#import "Additions/NSObject+GREYAdditions.h"
#import "Additions/NSURL+GREYAdditions.h"
#import "Common/GREYConfiguration.h"
#import "Common/GREYSwizzler.h"
#import "Delegate/GREYNSURLConnectionDelegate.h"
#import "Synchronization/GREYAppStateTracker.h"

static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

@implementation NSURLConnection (GREYAdditions)

+ (void)load {
  @autoreleasepool {
    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
    SEL originalSelector = @selector(sendAsynchronousRequest:queue:completionHandler:);
    SEL swizzledSelector = @selector(greyswizzled_sendAsynchronousRequest:queue:completionHandler:);
    BOOL swizzleSuccess = [swizzler swizzleClass:self
                              replaceClassMethod:originalSelector
                                      withMethod:swizzledSelector];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle NSURLConnection sendAsynchronousRequest:queue:completionHandler:");

    originalSelector = @selector(connectionWithRequest:delegate:);
    swizzledSelector = @selector(greyswizzled_connectionWithRequest:delegate:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSelector
                                 withMethod:swizzledSelector];
    NSAssert(swizzleSuccess, @"Cannot swizzle NSURLConnection connectionWithRequest:delegate:");

    originalSelector = @selector(initWithRequest:delegate:startImmediately:);
    swizzledSelector = @selector(greyswizzled_initWithRequest:delegate:startImmediately:);
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:originalSelector
                                 withMethod:swizzledSelector];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle NSURLConnection initWithRequest:delegate:startImmediately:");

    originalSelector = @selector(initWithRequest:delegate:);
    swizzledSelector = @selector(greyswizzled_initWithRequest:delegate:);
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:originalSelector
                                 withMethod:swizzledSelector];
    NSAssert(swizzleSuccess, @"Cannot swizzle NSURLConnection initWithRequest:delegate:");

    originalSelector = @selector(start);
    swizzledSelector = @selector(greyswizzled_start);
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:originalSelector
                                 withMethod:swizzledSelector];
    NSAssert(swizzleSuccess, @"Cannot swizzle NSURLConnection start");

    originalSelector = @selector(cancel);
    swizzledSelector = @selector(greyswizzled_cancel);
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:originalSelector
                                 withMethod:swizzledSelector];
    NSAssert(swizzleSuccess, @"Cannot swizzle NSURLConnection cancel");
  }
}

/**
 *  Tracks the current connection as pending in GREYAppStateTracker.
 */
- (void)grey_trackPending {
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingNetworkRequest, self);
  objc_setAssociatedObject(self,
                           kStateTrackerElementIDKey,
                           elementID,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 *  Untracks the current connection from GREYAppStateTracker, marking it as completed.
 */
- (void)grey_untrackPending {
  NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingNetworkRequest, elementID);
}

#pragma mark - Swizzled Implementation

+ (void)greyswizzled_sendAsynchronousRequest:(NSURLRequest *)request
                                     queue:(NSOperationQueue *)queue
                         completionHandler:(void (^)(NSURLResponse *, NSData *, NSError *))handler {
  __block NSString *elementID;
  void (^customCompletion)(NSURLResponse *, NSData *, NSError *) = ^(NSURLResponse *response,
                                                                     NSData *data,
                                                                     NSError *error) {
    handler(response, data, error);
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingNetworkRequest, elementID);
  };

  if ([request.URL grey_shouldSynchronize]) {
    // We use customCompletion as the element as it is an identifer unique per connection,
    // also note that the value returned by TRACK_STATE_... must be saved because it will be
    // eventually used in |customCompletion| block to untrack.
    elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingNetworkRequest, customCompletion);
  }
  INVOKE_ORIGINAL_IMP3(void,
                       @selector(greyswizzled_sendAsynchronousRequest:queue:completionHandler:),
                       request,
                       queue,
                       customCompletion);
}

+ (NSURLConnection *)greyswizzled_connectionWithRequest:(NSURLRequest *)request
                                               delegate:(id<NSURLConnectionDelegate>)delegate {
  GREYNSURLConnectionDelegate *proxyDelegate =
      [[GREYNSURLConnectionDelegate alloc] initWithOriginalNSURLConnectionDelegate:delegate];
  NSURLConnection *connection =
      INVOKE_ORIGINAL_IMP2(NSURLConnection *,
                           @selector(greyswizzled_connectionWithRequest:delegate:),
                           request,
                           proxyDelegate);
  return connection;
}

- (instancetype)greyswizzled_initWithRequest:(NSURLRequest *)request
                                    delegate:(id<NSURLConnectionDelegate>)delegate {
  GREYNSURLConnectionDelegate *proxyDelegate =
      [[GREYNSURLConnectionDelegate alloc] initWithOriginalNSURLConnectionDelegate:delegate];
  id instance = INVOKE_ORIGINAL_IMP2(id,
                                     @selector(greyswizzled_initWithRequest:delegate:),
                                     request,
                                     proxyDelegate);
  // Track since this call will begin to load data from request.
  if ([request.URL grey_shouldSynchronize]) {
    [instance grey_trackPending];
  }
  return instance;
}

- (instancetype)greyswizzled_initWithRequest:(NSURLRequest *)request
                                    delegate:(id<NSURLConnectionDelegate>)delegate
                            startImmediately:(BOOL)startImmediately {
  if (startImmediately && [request.URL grey_shouldSynchronize]) {
    [self grey_trackPending];
  }
  GREYNSURLConnectionDelegate *proxyDelegate =
      [[GREYNSURLConnectionDelegate alloc] initWithOriginalNSURLConnectionDelegate:delegate];

  return INVOKE_ORIGINAL_IMP3(id,
                              @selector(greyswizzled_initWithRequest:delegate:startImmediately:),
                              request,
                              proxyDelegate,
                              startImmediately);
}

- (void)greyswizzled_start {
  if ([self.originalRequest.URL grey_shouldSynchronize]) {
    [self grey_trackPending];
  }

  return INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_start));
}

- (void)greyswizzled_cancel {
  [self grey_untrackPending];

  return INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_cancel));
}

@end
