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

#import "Event/GREYSingleSequenceTouchInjector.h"

#import <QuartzCore/QuartzCore.h>
#include <mach/mach_time.h>

#import "Additions/NSObject+GREYAdditions.h"
#import "Additions/UITouch+GREYAdditions.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYDefines.h"
#import "Common/GREYExposed.h"
#import "Common/GREYPrivate.h"

/**
 *  Maximum time to wait for UIWebView delegates to get called after the
 *  last touch (i.e. @c isLastTouch is @c YES).
 */
static const NSTimeInterval kGREYMaxIntervalForUIWebViewResponse = 2.0;

@implementation GREYTouchInfo

- (instancetype)initWithPoint:(CGPoint)point
                            lastTouch:(BOOL)isLastTouch
      deliveryTimeDeltaSinceLastTouch:(NSTimeInterval)timeDeltaSinceLastTouchSeconds
                           expendable:(BOOL)expendable {
  self = [super init];
  if (self) {
    _point = point;
    _lastTouch = isLastTouch;
    _deliveryTimeDeltaSinceLastTouch = timeDeltaSinceLastTouchSeconds;
    _expendable = expendable;
  }
  return self;
}

@end

@implementation GREYSingleSequenceTouchInjector {
  UIWindow *_window; // Window to which touches will be delivered.
  NSMutableArray *_touchInfoList; // List of objects that aid in creation of UITouches.
  CADisplayLink *_displayLink; // Synchronizes with display vsync updates.
  UITouch *_ongoingTouch; // Touch object first created to start the touch sequence.
  CFTimeInterval _previousTouchDeliveryTime; // Time at which previous touch event was delivered.
  CGPoint _previousTouchLocation; // Location at which previous touch was delivered.
  GREYTouchInjectorState _state; // Current state of the injector.
}

- (instancetype)initWithWindow:(UIWindow *)window {
  NSParameterAssert(window);

  self = [super init];
  if (self) {
    _window = window;
    _touchInfoList = [[NSMutableArray alloc] init];
    _state = kGREYTouchInjectorPendingStart;
    _previousTouchLocation = CGPointZero;
  }
  return self;
}

- (void)enqueueTouchInfoForDelivery:(GREYTouchInfo *)touchInfo {
  I_CHECK_MAIN_THREAD();
  [_touchInfoList addObject:touchInfo];
}

- (void)startInjecting {
  if (_state == kGREYTouchInjectorStarted) {
    return;
  }

  _state = kGREYTouchInjectorStarted;
  if (!_displayLink) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(dispatchTouch:)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
  [_displayLink setPaused:NO];
}

- (GREYTouchInjectorState)state {
  return _state;
}

#pragma mark - CADisplayLink

- (void)dispatchTouch:(CADisplayLink *)sender {
  I_CHECK_MAIN_THREAD();

  GREYTouchInfo *touchInfo =
      [self grey_dequeueTouchInfoForDeliveryWithCurrentTime:CACurrentMediaTime()];
  if (!touchInfo) {
    if (_touchInfoList.count == 0) {
      // Queue is empty - we are done delivering touches.
      _state = kGREYTouchInjectorStopped;
      [_displayLink invalidate];
      _displayLink = nil;
    }
    return;
  }
  CGPoint currentTouchLocation;

  if (!_ongoingTouch) {
    _ongoingTouch = [[UITouch alloc] initAtPoint:touchInfo.point relativeToWindow:_window];
    [_ongoingTouch setPhase:UITouchPhaseBegan];
    currentTouchLocation = touchInfo.point;
  } else {
    if (touchInfo.isLastTouch) {
      [_ongoingTouch _setLocationInWindow:_previousTouchLocation resetPrevious:NO];
      [_ongoingTouch setPhase:UITouchPhaseEnded];
      currentTouchLocation = _previousTouchLocation;
    } else {
      [_ongoingTouch _setLocationInWindow:touchInfo.point resetPrevious:NO];
      UITouchPhase phase = UITouchPhaseMoved;
      if (CGPointEqualToPoint(_previousTouchLocation, touchInfo.point)) {
        phase = UITouchPhaseStationary;
      }
      [_ongoingTouch setPhase:phase];
      currentTouchLocation = touchInfo.point;
    }
  }

  UITouchesEvent *event = [[UIApplication sharedApplication] _touchesEvent];
  [event _clearTouches];

  uint64_t machAbsoluteTime = mach_absolute_time();
  AbsoluteTime timeStamp;
  timeStamp.hi = (UInt32)(machAbsoluteTime >> 32);
  timeStamp.lo = (UInt32)(machAbsoluteTime);

  [_ongoingTouch setTimestamp:[[NSProcessInfo processInfo] systemUptime]];

  IOHIDDigitizerEventMask eventMask = (_ongoingTouch.phase == UITouchPhaseMoved)
      ? kIOHIDDigitizerEventPosition
      : (kIOHIDDigitizerEventRange | kIOHIDDigitizerEventTouch);

  // Both range and touch are set to 0 if phase is UITouchPhaseEnded, 1 otherwise.
  Boolean isRangeAndTouch = (_ongoingTouch.phase != UITouchPhaseEnded);
  IOHIDEventRef hidEvent = IOHIDEventCreateDigitizerFingerEvent(kCFAllocatorDefault,
                                                                timeStamp,
                                                                0,
                                                                2,
                                                                eventMask,
                                                                currentTouchLocation.x,
                                                                currentTouchLocation.y,
                                                                0,
                                                                0,
                                                                0,
                                                                isRangeAndTouch,
                                                                isRangeAndTouch,
                                                                0);
  if ([_ongoingTouch respondsToSelector:@selector(_setHidEvent:)]) {
    [_ongoingTouch _setHidEvent:hidEvent];
  }

  [event _setHIDEvent:hidEvent];
  [event _addTouch:_ongoingTouch forDelayedDelivery:NO];

  // iOS adds an autorelease pool around every event-based interaction.
  // We should mimic that if we want to relinquish bits in a timely manner.
  @autoreleasepool {
    _previousTouchDeliveryTime = CACurrentMediaTime();
    _previousTouchLocation = currentTouchLocation;

    @try {
      [[UIApplication sharedApplication] sendEvent:event];

      // If a UIWebView is being tapped, allow time for delegates to be called after end touch.
      if (touchInfo.isLastTouch) {
        UIView *touchView = _ongoingTouch.view;
        UIWebView *touchWebView = nil;
        if ([touchView isKindOfClass:[UIWebView class]]) {
          touchWebView = (UIWebView *)touchView;
        } else {
          NSArray *webViewContainers =
              [touchView grey_containersAssignableFromClass:[UIWebView class]];
          if (webViewContainers.count > 0) {
            touchWebView = (UIWebView *)[webViewContainers firstObject];
          }
        }
        [touchWebView grey_pendingInteractionForTime:kGREYMaxIntervalForUIWebViewResponse];
      }
    } @finally {
      // We need to release the event manually, otherwise it will leak.
      if (hidEvent) {
        CFRelease(hidEvent);
      }
      if (touchInfo.isLastTouch) {
        _ongoingTouch = nil;
      }
    }
  }
}

#pragma mark - Private

/**
 *  Dequeues the next touch to be delivered based on @c currentTime.
 *
 *  @param currentTime The time for the next touch to be dequeued.
 *
 *  @return The touch info for the next touch. If a touch could not be dequeued
 *          (which can happen if queue is empty or if we attempt to dequeue too early)
 *          @c nil is returned.
 */
- (GREYTouchInfo *)grey_dequeueTouchInfoForDeliveryWithCurrentTime:(CFTimeInterval)currentTime {
  if (_touchInfoList.count == 0) {
    return nil;
  }

  // Count the number of stale touches.
  NSUInteger staleTouches = 0;
  CFTimeInterval simulatedPreviousDeliveryTime = _previousTouchDeliveryTime;
  for (GREYTouchInfo *touchInfo in _touchInfoList) {
    simulatedPreviousDeliveryTime += touchInfo.deliveryTimeDeltaSinceLastTouch;
    if (touchInfo.isExpendable &&
        simulatedPreviousDeliveryTime < currentTime) {
      staleTouches++;
    } else {
      break;
    }
  }

  // Remove all but the last stale touch if any.
  [_touchInfoList removeObjectsInRange:NSMakeRange(0, (staleTouches > 1) ? (staleTouches - 1) : 0)];
  GREYTouchInfo *dequeuedTouchInfo = [_touchInfoList firstObject];

  CFTimeInterval expectedTouchDeliveryTime =
      dequeuedTouchInfo.deliveryTimeDeltaSinceLastTouch + _previousTouchDeliveryTime;
  if (expectedTouchDeliveryTime > currentTime) {
    // This touch is scheduled to be delivered in the future.
    return nil;
  }
  [_touchInfoList removeObjectAtIndex:0];
  return dequeuedTouchInfo;
}

@end
