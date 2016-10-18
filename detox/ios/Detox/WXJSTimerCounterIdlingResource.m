//
//  WXJSTimerCounterIdlingResource.m
//  Detox
//
//  Created by Leo Natan (Wix) on 14/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "WXJSTimerCounterIdlingResource.h"
@import ObjectiveC;

@implementation WXJSTimerCounterIdlingResource
{
	NSUInteger _timersCount;
	dispatch_queue_t _timersCounterSerialQueue;
}

- (instancetype)init
{
	self = [super init];
	if(self)
	{
		_timersCounterSerialQueue = dispatch_queue_create("_timersCounterSerialQueue", NULL);
		
		__weak __typeof(self) weakSelf = self;
		
		Class cls = NSClassFromString(@"RCTTiming");
		Method m = class_getInstanceMethod(cls, NSSelectorFromString(@"scheduleSleepTimer:"));
		
		void (*orig_scheduleSleepTimer)(id, SEL, NSDate*) = (void(*)(id, SEL, NSDate*))method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^(id _self, NSDate* date) {
			__strong __typeof(weakSelf) strongSelf = weakSelf;
			if(strongSelf)
			{
				dispatch_sync(strongSelf->_timersCounterSerialQueue, ^{
					strongSelf->_timersCount += 1;
				});
			}
			
			orig_scheduleSleepTimer(_self, NSSelectorFromString(@"scheduleSleepTimer:"), date);
		}));
		
		m = class_getInstanceMethod(cls, NSSelectorFromString(@"timerDidFire"));
		void (*orig_timerDidFire)(id, SEL) = (void(*)(id, SEL))method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^ (id _self) {
			__strong __typeof(weakSelf) strongSelf = weakSelf;
			if(strongSelf)
			{
				dispatch_sync(strongSelf->_timersCounterSerialQueue, ^{
					strongSelf->_timersCount -= 1;
				});
			}
			
			orig_timerDidFire(_self, NSSelectorFromString(@"timerDidFire"));
		}));
	}
	return self;
}

- (BOOL)isIdleNow
{
	__block BOOL rv = NO;
	
	dispatch_sync(_timersCounterSerialQueue, ^{
		rv = _timersCount == 0;
	});
	
	return rv;
}

- (NSString *)idlingResourceName
{
	return NSStringFromClass([self class]);
}

- (NSString *)idlingResourceDescription
{
	return [self idlingResourceName];
}

@end
