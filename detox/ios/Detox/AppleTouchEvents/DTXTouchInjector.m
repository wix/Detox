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

#import "DTXTouchInjector.h"

#import <QuartzCore/QuartzCore.h>
#include <mach/mach_time.h>

#import "UITouch+DTXAdditions.h"
#import "DTXAppleInternals.h"
#import "DTXRunLoopSpinner.h"
#import "DTXTouchInfo-Private.h"

@implementation DTXTouchInjector
{
	// Window to which touches will be delivered.
	UIWindow* _window;
	// List of objects that aid in creation of UITouches.
	NSMutableArray<DTXTouchInfo*>* _enqueuedTouchInfoList;
	// A display link used for injecting touches.
	CADisplayLink* _displayLink;
	// Touch objects created to start the touch sequence for every
	// touch points. It stores one UITouch object for each finger
	// in a touch event.
	NSMutableArray<UITouch*>* _ongoingUITouches;
	// Current state of the injector.
	DTXTouchInjectorState _state;
	// The previously injected touch event. Used to determine
	// whether an injected touch needs to be stationary or not.
	// May be nil.
	DTXTouchInfo* _previousTouchInfo;
	
	BOOL (^_callback)(UITouchPhase);
	BOOL _abortedByCallback;
}

- (instancetype)initWithWindow:(UIWindow *)window onTouchInectCallback:(nullable BOOL(^)(UITouchPhase))callback
{
	NSParameterAssert(window != nil);
	
	self = [super init];
	if (self)
	{
		_window = window;
		_enqueuedTouchInfoList = [[NSMutableArray alloc] init];
		_state = kDTXTouchInjectorPendingStart;
		_ongoingUITouches = [[NSMutableArray alloc] init];
		_callback = callback;
	}
	return self;
}

- (void)enqueueTouchInfoForDelivery:(DTXTouchInfo *)touchInfo
{
	NSParameterAssert(NSThread.isMainThread);
	
	touchInfo.enqueuedMediaTime = _enqueuedTouchInfoList.count == 0 ? CACurrentMediaTime() : _enqueuedTouchInfoList.lastObject.fireMediaTime;
	[_enqueuedTouchInfoList addObject:touchInfo];
	
	[_enqueuedTouchInfoList sortUsingDescriptors:@[[NSSortDescriptor sortDescriptorWithKey:@"fireMediaTime" ascending:YES]]];
}

- (DTXTouchInjectorState)state
{
	return _state;
}

- (void)startInjecting
{
	NSParameterAssert(NSThread.isMainThread);
	
	if (_state == kDTXTouchInjectorStarted)
	{
		return;
	}
	
	_state = kDTXTouchInjectorStarted;
	if(_displayLink == nil)
	{
		_displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(displayLinkDidTick)];
		[_displayLink addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
	}
}

- (void)waitUntilAllTouchesAreDeliveredUsingInjector
{
	NSParameterAssert(NSThread.isMainThread);
	
	// Start if necessary.
	if (_state == kDTXTouchInjectorPendingStart || _state == kDTXTouchInjectorStopped)
	{
		[self startInjecting];
	}
	
	// Now wait for it to finish.
	DTXRunLoopSpinner *runLoopSpinner = [DTXRunLoopSpinner new];
	runLoopSpinner.timeout = DBL_MAX;
	runLoopSpinner.minRunLoopDrains = 0;
	runLoopSpinner.maxSleepInterval = DBL_MAX;
	[runLoopSpinner spinWithStopConditionBlock:^BOOL
	{
		return (_state == kDTXTouchInjectorStopped);
	}];
}

#pragma mark - Display Link

- (void)displayLinkDidTick
{
	NSParameterAssert(NSThread.isMainThread);
	
	DTXTouchInfo *touchInfo = [self dtx_dequeueTouchInfoForDeliveryWithCurrentTime:CACurrentMediaTime()];
	if (!touchInfo)
	{
		if (_enqueuedTouchInfoList.count == 0)
		{
			// Queue is empty - we are done delivering touches.
			[self dtx_stopTouchInjection];
		}
		return;
	}
	
	UITouchPhase reportedPhase;
	
	if ([_ongoingUITouches count] == 0)
	{
		reportedPhase = UITouchPhaseBegan;
		[self dtx_extractAndChangeTouchToStartPhase:touchInfo];
	}
	else if (touchInfo.phase == DTXTouchInfoPhaseTouchEnded)
	{
		reportedPhase = UITouchPhaseEnded;
		[self dtx_changeTouchToEndPhase:touchInfo];
	}
	else
	{
		reportedPhase = UITouchPhaseMoved;
		if(_abortedByCallback == NO)
		{
			[self dtx_changeTouchToMovePhase:touchInfo];
		}
	}
	[self dtx_injectTouches:touchInfo];
	
	if(_callback && _abortedByCallback == NO)
	{
		_abortedByCallback = _callback(reportedPhase) == NO;
		
		if(_abortedByCallback)
		{
			//Clean up the pending touches list from any subsequent non -Ended touches.
			[_enqueuedTouchInfoList filterUsingPredicate:[NSPredicate predicateWithFormat:@"phase == %@", @(DTXTouchInfoPhaseTouchEnded)]];
		}
	}
}


#pragma mark - Private

/**
 *  Helper method to return UITouch object at @c index from the @c ongoingTouches array.
 *
 *  @param index Index of the @c ongoingTouches array.
 *
 *  @return UITouch object at that given @c index of the @c ongoingTouches array.
 */
- (UITouch *)dtx_UITouchForFinger:(NSUInteger)index
{
	return (UITouch *)[_ongoingUITouches objectAtIndex:index];
}

/**
 *  Extracts UITouches from @c touchInfo object and inserts those in the ongoingTouches array.
 *  Phase of UITouch is set to UITouchPhaseBegan.
 *
 *  @param touchInfo The info that is used to create the UITouch.
 */
- (void)dtx_extractAndChangeTouchToStartPhase:(DTXTouchInfo *)touchInfo
{
	for (NSValue *touchPoint in touchInfo.points)
	{
		CGPoint point = [touchPoint CGPointValue];
		UITouch *touch = [[UITouch alloc] initAtPoint:point relativeToWindow:_window];
		[touch setPhase:UITouchPhaseBegan];
		[_ongoingUITouches addObject:touch];
	}
}

/**
 *  Phase of UITouches is set to UITouchPhaseEnded for the lastTouch condition.
 *
 *  @param touchInfo The info that is used to create the UITouch.
 */
- (void)dtx_changeTouchToEndPhase:(DTXTouchInfo *)touchInfo
{
	for (NSUInteger i = 0; i < [touchInfo.points count]; i++)
	{
		UITouch *touch = [self dtx_UITouchForFinger:i];
		CGPoint touchPoint = [[_previousTouchInfo.points objectAtIndex:i] CGPointValue];
		[touch _setLocationInWindow:touchPoint resetPrevious:NO];
		[touch setPhase:UITouchPhaseEnded];
	}
}

/**
 *  Phase of UITouches is set to UITouchPhaseMoved and currentTouchLocation is set to the
 *  current touch point.
 *
 *  @param touchInfo The info that is used to create the UITouch.
 */
- (void)dtx_changeTouchToMovePhase:(DTXTouchInfo *)touchInfo
{
	for (NSUInteger i = 0; i < [touchInfo.points count]; i++)
	{
		CGPoint touchPoint = [[touchInfo.points objectAtIndex:i] CGPointValue];
		UITouch *touch = [self dtx_UITouchForFinger:i];
		[touch _setLocationInWindow:touchPoint resetPrevious:NO];
		CGPoint previousTouchPoint = [[_previousTouchInfo.points objectAtIndex:i] CGPointValue];
		if (CGPointEqualToPoint(previousTouchPoint, touchPoint))
		{
			[touch setPhase:UITouchPhaseStationary];
		}
		else
		{
			[touch setPhase:UITouchPhaseMoved];
		}
	}
}

/**
 *  Inject touches to the application.
 *
 *  @param touchInfo The info that is used to create the UITouch.
 */
- (void)dtx_injectTouches:(DTXTouchInfo *)touchInfo
{
	UITouchesEvent *event = [[UIApplication sharedApplication] _touchesEvent];
	// Clean up before injecting touches.
	[event _clearTouches];
	
	// Array to store all hidEvent references to be released later.
	NSMutableArray *hidEvents = [NSMutableArray arrayWithCapacity:[_ongoingUITouches count]];
	
	uint64_t machAbsoluteTime = mach_absolute_time();
	AbsoluteTime timeStamp;
	timeStamp.hi = (UInt32)(machAbsoluteTime >> 32);
	timeStamp.lo = (UInt32)(machAbsoluteTime);
	
	UIView *currentTouchView = nil;
	for (NSUInteger i = 0; i < [_ongoingUITouches count]; i++)
	{
		UITouch *currentTouch = [self dtx_UITouchForFinger:i];
		if (i == 0)
		{
			currentTouchView = currentTouch.view;
		}
		[currentTouch setTimestamp:[[NSProcessInfo processInfo] systemUptime]];
		
		IOHIDDigitizerEventMask eventMask = currentTouch.phase == UITouchPhaseMoved ? kIOHIDDigitizerEventPosition : (kIOHIDDigitizerEventRange | kIOHIDDigitizerEventTouch);
		
		CGPoint touchLocation = [currentTouch locationInView:currentTouch.window];
		
		// Both range and touch are set to 0 if phase is UITouchPhaseEnded, 1 otherwise.
		Boolean isRangeAndTouch = (currentTouch.phase != UITouchPhaseEnded);
		IOHIDEventRef hidEvent = IOHIDEventCreateDigitizerFingerEvent(kCFAllocatorDefault, timeStamp, 0, 2, eventMask, touchLocation.x, touchLocation.y, 0, 0, 0, isRangeAndTouch, isRangeAndTouch, 0);
		
		[hidEvents addObject:[NSValue valueWithPointer:hidEvent]];
		
		if ([currentTouch respondsToSelector:@selector(_setHidEvent:)])
		{
			[currentTouch _setHidEvent:hidEvent];
		}
		
		[event _addTouch:currentTouch forDelayedDelivery:NO];
	}
	
	[event _setHIDEvent:[[hidEvents objectAtIndex:0] pointerValue]];
	// iOS adds an autorelease pool around every event-based interaction.
	// We should mimic that if we want to relinquish bits in a timely manner.
	@autoreleasepool
	{
		_previousTouchInfo = touchInfo;
		BOOL touchViewContainsWKWebView = NO;
		
		@try
		{
			[[UIApplication sharedApplication] sendEvent:event];
			
			if (currentTouchView)
			{
				// If a WKWebView is being tapped, don't call [event _clearTouches], as this causes long
				// presses to fail. For this case, the child of |currentTouchView| is a WKCompositingView.
				UIView *firstChild = currentTouchView.subviews.firstObject;
				if ([firstChild isKindOfClass:NSClassFromString(@"WKCompositingView")])
				{
					touchViewContainsWKWebView = YES;
				}
			}
		}
		@catch (NSException *e)
		{
			[self dtx_stopTouchInjection];
			@throw;
		}
		@finally
		{
			// Clear all touches so that it is not leaked, except for WKWebViews, where these calls
			// can prevent the app tracker from becoming idle.
			if (!touchViewContainsWKWebView)
			{
				[event _clearTouches];
			}
			// We need to release the event manually, otherwise it will leak.
			for (NSValue *hidEventValue in hidEvents)
			{
				IOHIDEventRef hidEvent = [hidEventValue pointerValue];
				CFRelease(hidEvent);
			}
			[hidEvents removeAllObjects];
			if (touchInfo.phase == DTXTouchInfoPhaseTouchEnded)
			{
				[_ongoingUITouches removeAllObjects];
			}
		}
	}
}

/**
 *  Stops touch injection by invalidating the current timer and clearing the touch info list.
 */
- (void)dtx_stopTouchInjection
{
	_state = kDTXTouchInjectorStopped;
	[_displayLink invalidate];
	_displayLink = nil;
	[_enqueuedTouchInfoList removeAllObjects];
}

/**
 *  Dequeues the next touch to be delivered based on @c currentTime.
 *
 *  @param currentTime The time for the next touch to be dequeued.
 *
 *  @return The touch info for the next touch. If a touch could not be dequeued
 *          (which can happen if queue is empty or if we attempt to dequeue too early)
 *          @c nil is returned.
 */
- (DTXTouchInfo *)dtx_dequeueTouchInfoForDeliveryWithCurrentTime:(CFTimeInterval)currentTime
{
	if(_enqueuedTouchInfoList.firstObject.fireMediaTime > currentTime)
	{
		return nil;
	}
	
	DTXTouchInfo* rv = [_enqueuedTouchInfoList firstObject];
	if(rv != nil)
	{
		[_enqueuedTouchInfoList removeObjectAtIndex:0];
	}
	
	return rv;
}

@end
