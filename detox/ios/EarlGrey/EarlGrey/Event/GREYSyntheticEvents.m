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

#import "Event/GREYSyntheticEvents.h"

#import "Additions/NSString+GREYAdditions.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYConstants.h"
#import "Common/GREYExposed.h"
#import "Event/GREYSingleSequenceTouchInjector.h"
#import "Synchronization/GREYUIThreadExecutor.h"

#pragma mark - Extern

NSString *const kGREYSyntheticEventInjectionErrorDomain =
    @"com.google.earlgrey.SyntheticEventInjectionErrorDomain";

#pragma mark - Implementation

@implementation GREYSyntheticEvents {
  /**
   *  The touch injector that completes the touch sequence for an event.
   */
  GREYSingleSequenceTouchInjector *_touchInjector;
}

+ (BOOL)rotateDeviceToOrientation:(UIDeviceOrientation)deviceOrientation
                       errorOrNil:(__strong NSError **)errorOrNil {
  I_CHECK_MAIN_THREAD();

  NSError *error;
  UIDeviceOrientation initialDeviceOrientation = [[UIDevice currentDevice] orientation];
  BOOL success = [[GREYUIThreadExecutor sharedInstance] executeSyncWithTimeout:10.0 block:^{
    [[UIDevice currentDevice] setOrientation:deviceOrientation animated:YES];
  } error:&error];

  if (!success) {
    if (errorOrNil) {
      *errorOrNil = error;
    } else {
      I_GREYFail(@"Failed to change device orientation due to error: %@", error);
    }
  } else if (deviceOrientation != [[UIDevice currentDevice] orientation]) {
    NSString *errorDescription =
        [NSString stringWithFormat:@"Device orientation could not be set to %@ from %@.",
            NSStringFromUIDeviceOrientation(deviceOrientation),
            NSStringFromUIDeviceOrientation(initialDeviceOrientation)];

    if (errorOrNil) {
      NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : errorDescription };
      *errorOrNil = [NSError errorWithDomain:kGREYSyntheticEventInjectionErrorDomain
                                        code:kGREYOrientationChangeFailedErrorCode
                                    userInfo:userInfo];
      return NO;
    } else {
      I_GREYFail(@"Device orientation could not be set to %@ from %@.",
                 NSStringFromUIDeviceOrientation(deviceOrientation),
                 NSStringFromUIDeviceOrientation(initialDeviceOrientation));
    }
  }

  return success;
}

+ (void)touchAlongPath:(NSArray *)touchPath
      relativeToWindow:(UIWindow *)window
           forDuration:(NSTimeInterval)duration
            expendable:(BOOL)expendable {
  NSParameterAssert([touchPath count] >= 1);
  NSParameterAssert(duration >= 0);

  GREYSyntheticEvents *eventGenerator = [[GREYSyntheticEvents alloc] init];
  [eventGenerator beginTouchAtPoint:[[touchPath firstObject] CGPointValue]
                   relativeToWindow:window
                  immediateDelivery:NO];

  CFTimeInterval delayBetweenEachEvent = 0;
  if (touchPath.count > 1) {
    delayBetweenEachEvent = duration / (double)(touchPath.count - 1);
  }

  for (NSUInteger i = 1; i < [touchPath count]; i++) {
    [eventGenerator grey_continueTouchAtPoint:[touchPath[i] CGPointValue]
        afterTimeElapsedSinceLastTouchDelivery:delayBetweenEachEvent
                             immediateDelivery:NO
                                    expendable:expendable];
  }
  [eventGenerator endTouch];
}

- (void)beginTouchAtPoint:(CGPoint)point
         relativeToWindow:(UIWindow *)window
        immediateDelivery:(BOOL)immediate {
  NSAssert(!_touchInjector, @"Cannot call this method more than once until endTouch is called.");

  _touchInjector = [[GREYSingleSequenceTouchInjector alloc] initWithWindow:window];
  GREYTouchInfo *touchInfo = [[GREYTouchInfo alloc] initWithPoint:point
                                                        lastTouch:NO
                                  deliveryTimeDeltaSinceLastTouch:0
                                                       expendable:NO];
  [_touchInjector enqueueTouchInfoForDelivery:touchInfo];
  if (immediate) {
    [self grey_waitForInjectorToFinishDeliveringTouches:_touchInjector];
  }
}

- (void)continueTouchAtPoint:(CGPoint)point
           immediateDelivery:(BOOL)immediate
                  expendable:(BOOL)expendable {
  [self grey_continueTouchAtPoint:point
      afterTimeElapsedSinceLastTouchDelivery:0
                           immediateDelivery:immediate
                                  expendable:expendable];
}

- (void)endTouch {
  GREYTouchInfo *touchInfo = [[GREYTouchInfo alloc] initWithPoint:CGPointZero
                                                        lastTouch:YES
                                  deliveryTimeDeltaSinceLastTouch:0
                                                       expendable:NO];
  [_touchInjector enqueueTouchInfoForDelivery:touchInfo];
  [self grey_waitForInjectorToFinishDeliveringTouches:_touchInjector];

  _touchInjector = nil;
}

#pragma mark - Private

/**
 *  Enqueues the next touch to be delivered.
 *
 *  @param point      The point at which the touch is to be made.
 *  @param seconds    An interval to wait after the last touch event.
 *  @param immediate  if @c YES, this method blocks until touch is delivered, otherwise the touch is
 *                    enqueued for delivery the next time runloop drains.
 *  @param expendable Indicates that this touch point is intended to be delivered in a timely
 *                    manner rather than reliably.
 */
- (void)grey_continueTouchAtPoint:(CGPoint)point
    afterTimeElapsedSinceLastTouchDelivery:(NSTimeInterval)seconds
                         immediateDelivery:(BOOL)immediate
                                expendable:(BOOL)expendable {
  GREYTouchInfo *touchInfo = [[GREYTouchInfo alloc] initWithPoint:point
                                                        lastTouch:NO
                                  deliveryTimeDeltaSinceLastTouch:seconds
                                                       expendable:expendable];
  [_touchInjector enqueueTouchInfoForDelivery:touchInfo];

  if (immediate) {
    [self grey_waitForInjectorToFinishDeliveringTouches:_touchInjector];
  }
}

/**
 *  Method that injects a touch event until completion.
 *
 *  @param injector The touch injector that contains the touches to be made.
 */
- (void)grey_waitForInjectorToFinishDeliveringTouches:(GREYSingleSequenceTouchInjector *)injector {
  // Start if necessary.
  if ([injector state] == kGREYTouchInjectorPendingStart ||
      [injector state] == kGREYTouchInjectorStopped) {
    [injector startInjecting];
  }
  // Now wait for it to finish.
  while ([injector state] != kGREYTouchInjectorStopped) {
    [[GREYUIThreadExecutor sharedInstance] drainOnce];
  }
}

@end
