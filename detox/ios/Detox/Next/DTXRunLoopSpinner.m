//
// Copyright 2018 Google Inc.
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
#import "DTXRunLoopSpinner.h"

#import "UIApplication+DTXAdditions.h"

/**
 *  The default minimum number of runloop drains. The default is 2 because, as per the CFRunLoop
 *  implementation, some ports (specifically the dispatch port) will only be serviced every other
 *  runloop drain.
 */
static const NSUInteger kDefaultMinRunLoopDrains = 2;

/**
 *  No-op timer handler block.
 */
static void (^gNoopTimerHandler)(CFRunLoopTimerRef timer) = ^(CFRunLoopTimerRef timer) {
};

@implementation DTXRunLoopSpinner
{
	BOOL _spinning;
}

- (instancetype)init
{
	self = [super init];
	if (self) {
		_maxSleepInterval = 0;
		_minRunLoopDrains = kDefaultMinRunLoopDrains;
	}
	return self;
}

- (BOOL)spinWithStopConditionBlock:(BOOL (^)(void))stopConditionBlock
{
	NSAssert(_spinning == NO, @"Should not spin the same runloop spinner instance concurrently.");
	
	_spinning = YES;
	CFTimeInterval timeoutTime = CACurrentMediaTime() + _timeout;
	BOOL stopConditionMet = NO;
	BOOL needToDrainRunLoop = (CFRunLoopGetCurrent() == CFRunLoopGetMain());
	
	if (_minRunLoopDrains > 0) {
		stopConditionMet = [self dtx_drainRunLoopInActiveModeForDrains:_minRunLoopDrains
												   explicitRunLoopDrain:needToDrainRunLoop
														 checkCondition:stopConditionBlock];
	} else {
		stopConditionMet =
		[self dtx_checkConditionInActiveModeWithExplicitRunLoopDrain:needToDrainRunLoop
												   stopConditionBlock:stopConditionBlock];
	}
	
	CFTimeInterval remainingTime = [self dtx_secondsUntilTime:timeoutTime];
	while (!stopConditionMet && remainingTime > 0) {
		@autoreleasepool {
			stopConditionMet = [self dtx_drainRunLoopInActiveModeAndCheckCondition:stopConditionBlock
															   explicitRunLoopDrain:needToDrainRunLoop
																			forTime:remainingTime];
			remainingTime = [self dtx_secondsUntilTime:timeoutTime];
		}
	}
	
	_spinning = NO;
	return stopConditionMet;
}

#pragma mark - Private

/**
 *  Spins the runloop in the active mode for @c exitDrainCount drains and check the condition
 *
 *
 *  @param drainCount           The number of times to drain the active runloop.
 *  @param explicitRunLoopDrain Whether to drain the main runloop explicitly.
 *  @param stopConditionBlock   The condition block that should be checked to determine if we should
 *                              stop initiating drains in the active mode.
 *
 *  @return @c YES if the condition block was evaluated to @c YES while draining or after the active
 *          runloop finished; @c NO otherwise.
 */
- (BOOL)dtx_drainRunLoopInActiveModeForDrains:(NSUInteger)drainCount
						  explicitRunLoopDrain:(BOOL)explicitRunLoopDrain
								checkCondition:(BOOL (^)(void))stopConditionBlock {
	NSAssert(drainCount > 0, @"Requires at least one drain to execute the block");
	
	NSString *activeMode = [self dtx_activeRunLoopMode];
	dispatch_semaphore_t stopCondition = dispatch_semaphore_create(0L);
	__block NSUInteger currentDrainCount = 0;
	__block BOOL conditionMet = NO;
	__block BOOL conditionChecked = NO;
	void (^drainCountingBlock)(void) = ^{
		if (conditionChecked) {
			return;
		}
		
		currentDrainCount++;
		
		if (currentDrainCount <= drainCount) {
			return;
		}
		
		conditionMet = stopConditionBlock();
		if (conditionMet) {
			void (^conditionMetHandler)(void) = self.conditionMetHandler;
			if (conditionMetHandler) {
				conditionMetHandler();
			}
		}
		
		// When we signal here and exit the observer, the chances are we could still get notified if
		// the main thread doesn't yield just yet. We set a flag here to avoid subsequent entrances
		// into the runloop after the condition has been checked once.
		conditionChecked = YES;
		if (explicitRunLoopDrain) {
			CFRunLoopStop(CFRunLoopGetMain());
		} else {
			dispatch_semaphore_signal(stopCondition);
		}
	};
	
	void (^wakeUpBlock)(void) = ^{
		// Never let the runloop sleep while we are draining it for the minimum drains.
		CFRunLoopWakeUp(CFRunLoopGetMain());
	};
	
	// Drain the currently active mode in a while loop so that we handle cases where the active mode
	// finishes or is stopped. In these cases, we want to keep draining the (possibly new) active mode
	// for the remaining drains.
	while (currentDrainCount <= drainCount) {
		@autoreleasepool {
			CFRunLoopObserverRef drainCountingObserver =
			[self dtx_setupObserverInMode:activeMode
					withBeforeSourcesBlock:drainCountingBlock
						beforeWaitingBlock:wakeUpBlock
					  explicitRunLoopDrain:explicitRunLoopDrain];
			if (explicitRunLoopDrain) {
				CFRunLoopRunResult result = CFRunLoopRunInMode((CFStringRef)activeMode, DBL_MAX, NO);
				
				// In case that no sources are attached to the current runloop where the function returns
				// immedately and no observer will be called, we schedule an empty block to trigger the
				// observer, so the @c stopContion will be fired.
				if (result == kCFRunLoopRunFinished) {
					currentDrainCount++;
					// The trigger is only scheduled when it has one last time to drain so we don't
					// exhaust CPU
					if (currentDrainCount >= drainCount) {
						// Empty block to trigger the observer to occur.
						CFRunLoopPerformBlock(CFRunLoopGetMain(), (CFStringRef)activeMode,
											  ^{
						});
					}
				}
			} else {
				// Wake up the main runloop in the case it is already in the sleep state.
				wakeUpBlock();
				dispatch_semaphore_wait(stopCondition, DISPATCH_TIME_FOREVER);
			}
			[self dtx_teardownObserver:drainCountingObserver inMode:activeMode];
		}
	}
	
	return conditionMet;
}

/**
 *  Makes the runloop wait in the active mode till one of three conditions are hit:
 *
 *  1. The stop condition has been met.
 *  2. We have timed out.
 *  3. The runloop finishes.
 *  4. The runloop is stopped by someone else.
 *
 *  The stop condition is checked at least once per runloop drain.
 *
 *  @param stopConditionBlock   The condition block that should be checked to determine if we should
 *                              stop initiating drains in the active mode.
 *  @param explicitRunLoopDrain Whether to drain the main loop explicitly.
 *  @param time                 The timeout time after which we should stop initiating drains.
 *
 *  @return @c YES if the condition block was evaluated to @c YES while draining or after the active
 *          runloop finished; @c NO otherwise.
 *  @note   We only explicitly drain the main runloop on the main thread.
 */
- (BOOL)dtx_drainRunLoopInActiveModeAndCheckCondition:(BOOL (^)(void))stopConditionBlock
								  explicitRunLoopDrain:(BOOL)explicitRunLoopDrain
											   forTime:(CFTimeInterval)time {
	NSString *activeMode = [self dtx_activeRunLoopMode];
	CFRunLoopTimerRef wakeUpTimer = [self dtx_setupWakeUpTimerInMode:activeMode];
	__block BOOL conditionMet = NO;
	__weak __typeof__(self) weakSelf = self;
	
	dispatch_semaphore_t stopCondition = dispatch_semaphore_create(0L);
	void (^beforeSourcesConditionCheckBlock)(void) = ^{
		__typeof__(self) strongSelf = weakSelf;
		// It's possible that this block is still invoked while strongSelf is released if the observer
		// is registered and deregistered from a non-main thread. The main runloop may hold the observer
		// for one more drain to invoke.
		if (!strongSelf) {
			return;
		}
		
		if (!conditionMet && stopConditionBlock()) {
			if ([strongSelf conditionMetHandler]) {
				[strongSelf conditionMetHandler]();
			}
			conditionMet = YES;
			if (explicitRunLoopDrain) {
				CFRunLoopStop(CFRunLoopGetMain());
			} else {
				dispatch_semaphore_signal(stopCondition);
			}
		}
	};
	
	BOOL preventRunLoopFromSleeping = self.maxSleepInterval == 0;
	void (^beforeWaitingConditionCheckBlock)(void) = ^{
		__typeof__(self) strongSelf = weakSelf;
		// Ditto.
		if (!strongSelf) {
			return;
		}
		
		if (preventRunLoopFromSleeping) {
			CFRunLoopWakeUp(CFRunLoopGetMain());
		}
		
		// This observer callback is not guaranteed to be called, but we must also check if we should
		// stop the runloop here because we do not want the runloop to go to sleep if we should stop
		// the runloop. A source handled in the last drain may have satisfied the stop condition.
		//
		// Do not check stopConditionBlock() if stopConditionMet is already true. This will occur if we
		// stopped the runloop in the beforeSourcesConditionCheckBlock() handler. In this case, we do
		// not want to check the stop condition again.
		if (!conditionMet && stopConditionBlock()) {
			if ([strongSelf conditionMetHandler]) {
				[strongSelf conditionMetHandler]();
			}
			conditionMet = YES;
			if (explicitRunLoopDrain) {
				CFRunLoopStop(CFRunLoopGetMain());
			} else {
				dispatch_semaphore_signal(stopCondition);
			}
		}
	};
	
	CFRunLoopObserverRef conditionCheckingObserver =
	[self dtx_setupObserverInMode:activeMode
			withBeforeSourcesBlock:beforeSourcesConditionCheckBlock
				beforeWaitingBlock:beforeWaitingConditionCheckBlock
			  explicitRunLoopDrain:explicitRunLoopDrain];
	if (explicitRunLoopDrain) {
		// Only drains the main runloop.
		NSParameterAssert(NSThread.isMainThread);
		
		// In case of no sources or timers, we will drain the runloop one more time with a scheduled
		// empty block so it can trigger the observer and the @c stopCondition can be checked.
		for (int i = 0; i < 2; ++i) {
			CFRunLoopRunResult result = CFRunLoopRunInMode((CFStringRef)activeMode, time, NO);
			
			// Exit early if the runloop is handled or the observer is triggered at least once.
			if (result != kCFRunLoopRunFinished || i >= 1) {
				break;
			}
			
			NSAssert(conditionMet == NO, @"If the running the active mode returned finished, the condition should not have been met.");
			// Empty block to trigger the observer to occur in case of no attached sources or timers.
			CFRunLoopPerformBlock(CFRunLoopGetMain(), (CFStringRef)activeMode,
								  ^{
			});
		}
	} else {
		// Wake up the main runloop in the case it is already in the sleep state.
		CFRunLoopWakeUp(CFRunLoopGetMain());
		
		CFTimeInterval nanoTime = time * NSEC_PER_SEC;
		dispatch_time_t timeout = isinf(nanoTime) ? DISPATCH_TIME_FOREVER
		: dispatch_time(DISPATCH_TIME_NOW, (int64_t)nanoTime);
		dispatch_semaphore_wait(stopCondition, timeout);
	}
	[self dtx_teardownObserver:conditionCheckingObserver inMode:activeMode];
	[self dtx_teardownTimer:wakeUpTimer inMode:activeMode];
	
	return conditionMet;
}

/**
 *  Checks the stop condition block in the active mode and invokes the condition met handler in the
 *  active mode if it was evaluated to @c YES.
 *
 *  If this is called from the main thread, it will drain the runloop so it can handle the block in
 *  the active mode; if it is from a background thread, it will attempt to schedule the block, wake
 *  up the main runloop to execute it and exit.
 *
 *  @param explicitRunLoopDrain Whether to drain the main loop explicitly.
 *  @param stopConditionBlock   The condition block that should be evaluated in the active mode.
 *
 *  @return @c YES if the stop condition block evaluated to @YES; @c NO otherwise.
 */
- (BOOL)dtx_checkConditionInActiveModeWithExplicitRunLoopDrain:(BOOL)explicitRunLoopDrain
											 stopConditionBlock:(BOOL (^)(void))stopConditionBlock {
	__block BOOL conditionMet = NO;
	__weak __typeof__(self) weakSelf = self;
	
	dispatch_semaphore_t stopCondition;
	if (!explicitRunLoopDrain) {
		stopCondition = dispatch_semaphore_create(0L);
	}
	NSString *activeMode = [self dtx_activeRunLoopMode];
	CFRunLoopPerformBlock(CFRunLoopGetMain(), (CFStringRef)activeMode, ^{
		__typeof__(self) strongSelf = weakSelf;
		NSAssert(strongSelf != nil, @"The spinner should not have been deallocated.");
		
		if (stopConditionBlock()) {
			void (^conditionMetHandler)(void) = [strongSelf conditionMetHandler];
			if (conditionMetHandler) {
				conditionMetHandler();
			}
			conditionMet = YES;
		}
		if (!explicitRunLoopDrain) {
			dispatch_semaphore_signal(stopCondition);
		}
	});
	
	if (explicitRunLoopDrain) {
		// Handles at most one source in the active mode. All enqueued blocks are served before any
		// sources are served.
		CFRunLoopRunInMode((CFStringRef)activeMode, 0, true);
	} else {
		// Wake up the main runloop in the case of that it is already in the sleep state.
		CFRunLoopWakeUp(CFRunLoopGetMain());
		dispatch_semaphore_wait(stopCondition, DISPATCH_TIME_FOREVER);
	}
	
	return conditionMet;
}

/**
 *  Setup an observer in @c mode that will invoke the provided blocks when the on the appropriate
 *  observer events if and only if the runloop is running in @c mode and the mode has not been
 *  nested.
 *
 *  @remark We consider a mode "nested" if a source handled while we are spinning the runloop
 *          starts spinning the runloop in the same mode.
 *
 *  @param mode                 The mode that the observer should be added to.
 *  @param beforeSourcesBlock   Block that will be invoked when the added observer receives before-
 *                              sources callbacks and is not nested.
 *  @param beforeWaitingBlock   Block that will be invoked when the added observer receives before-
 *                              waiting callbacks and is not nested.
 *  @param explicitRunLoopDrain Whether the main runloop will be drained explicitly.
 *
 *  @return The registered observer.
 */
- (CFRunLoopObserverRef)dtx_setupObserverInMode:(NSString *)mode
						  withBeforeSourcesBlock:(void (^)(void))beforeSourcesBlock
							  beforeWaitingBlock:(void (^)(void))beforeWaitingBlock
							explicitRunLoopDrain:(BOOL)explicitRunLoopDrain {
	void (^observerBlock)(CFRunLoopObserverRef observer, CFRunLoopActivity activity);
	CFOptionFlags observerFlags = 0L;
	
	if (explicitRunLoopDrain) {
		observerFlags = kCFRunLoopEntry | kCFRunLoopExit;
		__block int numNestedRunLoopModes = 0;
		observerBlock = ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
			if (activity & kCFRunLoopEntry) {
				// When entering a runloop in @c mode, increment the nesting count.
				numNestedRunLoopModes++;
			} else if (activity & kCFRunLoopExit) {
				// When exiting a runloop in @c mode, decrement the nesting count.
				numNestedRunLoopModes--;
			} else if (activity & kCFRunLoopBeforeSources) {
				// When this observer was created, the nesting count was 0. When we started running the
				// runloop in @c mode, the runloop entered @c mode and incremented the nesting count. So
				// now, the "unnested" nesting count is 1.
				if (numNestedRunLoopModes == 1) {
					beforeSourcesBlock();
				}
			} else if (activity & kCFRunLoopBeforeWaiting) {
				if (numNestedRunLoopModes == 1) {
					beforeWaitingBlock();
				}
			} else {
				NSAssert(NO, @"Should not get here. Observer is not registered for any other options.");
			}
			
			NSAssert(numNestedRunLoopModes >= 0, @"The nesting count for |mode| should never be less than zero.");
		};
	} else {
		observerBlock = ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
			if (activity & kCFRunLoopBeforeSources) {
				beforeSourcesBlock();
			} else if (activity & kCFRunLoopBeforeWaiting) {
				beforeWaitingBlock();
			} else {
				NSAssert(NO, @"Should not get here. Observer is not registered for any other options.");
			}
		};
	}
	
	if (beforeSourcesBlock) {
		observerFlags = observerFlags | kCFRunLoopBeforeSources;
	}
	if (beforeWaitingBlock) {
		observerFlags = observerFlags | kCFRunLoopBeforeWaiting;
	}
	
	// Order = LONG_MAX so it is serviced last after all other higher priority observers.
	// Let the other observers do their job before querying for idleness.
	CFRunLoopObserverRef observer =
	CFRunLoopObserverCreateWithHandler(NULL, observerFlags, true, LONG_MAX, observerBlock);
	CFRunLoopAddObserver(CFRunLoopGetMain(), observer, (CFStringRef)mode);
	return observer;
}

/**
 *  Create and return a wake up timer in @c mode. Will not add a timer if @c maxSleepInterval
 *  is 0. The wake up timer will fire every @c maxSleepInterval to keep the runloop from sleeping
 *  more than @c maxSleepInterval while running in @c mode.
 *
 *  @param mode The mode that the timer should be added to.
 *
 *  @return The registered timer or @c nil if no timer was added to @c mode.
 */
- (CFRunLoopTimerRef)dtx_setupWakeUpTimerInMode:(NSString *)mode {
	if (_maxSleepInterval > 0) {
		CFRunLoopTimerRef timer = CFRunLoopTimerCreateWithHandler(
																  kCFAllocatorDefault, CFAbsoluteTimeGetCurrent() + _maxSleepInterval, _maxSleepInterval, 0,
																  0, gNoopTimerHandler);
		CFRunLoopAddTimer(CFRunLoopGetMain(), timer, (CFStringRef)mode);
		return timer;
	} else {
		return NULL;
	}
}

/**
 *  Remove @c observer from @c mode and then release it.
 *
 *  @param observer The observer to be removed and released.
 *  @param mode     The mode from which the observer should be removed.
 */
- (void)dtx_teardownObserver:(CFRunLoopObserverRef)observer inMode:(NSString *)mode {
	if (observer) {
		CFRunLoopRemoveObserver(CFRunLoopGetMain(), observer, (CFStringRef)mode);
		CFRelease(observer);
	}
}

/**
 *  Remove @c timer from @c mode and then release it.
 *
 *  @param timer The time to be removed and released.
 *  @param mode  The mode from which the timer should be removed.
 */
- (void)dtx_teardownTimer:(CFRunLoopTimerRef)timer inMode:(NSString *)mode {
	if (timer) {
		CFRunLoopRemoveTimer(CFRunLoopGetMain(), timer, (CFStringRef)mode);
		CFRelease(timer);
	}
}

/**
 *  @param time The point in time to measure against.
 *
 *  @return The time in seconds from now until @c time.
 */
- (CFTimeInterval)dtx_secondsUntilTime:(CFTimeInterval)time {
	return time - CACurrentMediaTime();
}

/**
 *  @return The active mode for the main runloop.
 */
- (NSString *)dtx_activeRunLoopMode {
	NSString *activeRunLoopMode = [[UIApplication sharedApplication] dtx_activeRunLoopMode];
	if (!activeRunLoopMode) {
		// If UIKit does not have any modes on its runloop stack, then consider the default
		// runloop mode as the active mode. We do not use the current runloop mode because if this
		// spinner is nested within another spinner, we could get stuck spinning the runloop in a
		// mode that was active but shouldn't be anymore.
		// TODO: Do better than just always using the default runloop mode.
		activeRunLoopMode = NSDefaultRunLoopMode;
	}
	return activeRunLoopMode;
}

#pragma mark - Getters and Setters

- (void)setMaxSleepInterval:(CFTimeInterval)maxSleepInterval {
	NSAssert(maxSleepInterval >= 0, @"Maximum sleep interval must be non-negative.");
	_maxSleepInterval = maxSleepInterval;
}

- (void)setTimeout:(CFTimeInterval)timeout {
	NSAssert(timeout >= 0, @"Timeout must be non-negative.");
	_timeout = timeout;
}

@end
