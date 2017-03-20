//
//  WXJSTimerObservationIdlingResource.m
//  Detox
//
//  Created by Leo Natan (Wix) on 14/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "WXJSTimerObservationIdlingResource.h"
@import ObjectiveC;

@interface _WXJSTimingObservationWrapper : NSObject @end
@implementation _WXJSTimingObservationWrapper
{
	NSMutableArray<NSNumber*>* _observedTimers;
	NSMutableDictionary* _timers;
}

- (instancetype)initWithTimers:(NSMutableDictionary*)timers
{
	self = [super init];
	if(self)
	{
		_timers = timers;
		_observedTimers = [NSMutableArray new];
	}
	
	return self;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector
{
	NSMethodSignature* sig = [super methodSignatureForSelector:aSelector];
	
	if(sig == nil)
	{
		sig = [_timers methodSignatureForSelector:aSelector];
	}
	
	return sig;
}

- (void)forwardInvocation:(NSInvocation *)anInvocation
{
	[anInvocation invokeWithTarget:_timers];
}

- (void)addObservedTimer:(NSNumber*)observedNumber
{
	[_observedTimers addObject:observedNumber];
}

- (NSUInteger)countOfObservedTimers
{
	return _observedTimers.count;
}

- (void)removeObjectForKey:(NSNumber*)aKey
{
	if([_observedTimers containsObject:aKey])
	{
		NSLog(@"☣️ DETOX:: Removing observed timer %@", aKey);
		[_observedTimers removeObject:aKey];
	}
	
	[_timers removeObjectForKey:aKey];
}

@end

@implementation WXJSTimerObservationIdlingResource
{
	NSMapTable<id, _WXJSTimingObservationWrapper*>* _observations;
	dispatch_queue_t _timersObservationQueue;
	NSTimeInterval _durationThreshold;
}

- (void)setDurationThreshold:(NSTimeInterval)durationThreshold
{
	_durationThreshold = durationThreshold;
}

- (NSString*)failuireReasonForDuration:(NSTimeInterval)duration repeats:(BOOL)repeats
{
	if(duration == 0)
	{
		return @"duration==0";
	}
	else if(repeats == YES)
	{
		return @"repeats==true";
	}
	else if(duration > _durationThreshold)
	{
		return [NSString stringWithFormat:@"duration>%@", @(_durationThreshold)];
	}
	
	return @"";
}

- (instancetype)init
{
	self = [super init];
	if(self)
	{
		_timersObservationQueue = dispatch_queue_create("_timersCounterSerialQueue", NULL);
		_observations = [NSMapTable mapTableWithKeyOptions:NSMapTableWeakMemory valueOptions:NSMapTableStrongMemory];
		_durationThreshold = 1.5;
		
		__weak __typeof(self) weakSelf = self;
		
		Class cls = NSClassFromString(@"RCTTiming");
		SEL createTimerSel = NSSelectorFromString(@"createTimer:duration:jsSchedulingTime:repeats:");
		Method m = class_getInstanceMethod(cls, createTimerSel);
		
		void (*orig_createTimer)(id, SEL, NSNumber*, NSTimeInterval, NSDate*, BOOL) = (void(*)(id, SEL, NSNumber*, NSTimeInterval, NSDate*, BOOL))method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^(id _self, NSNumber* timerID, NSTimeInterval duration, NSDate* jsDate, BOOL repeats) {
			__strong __typeof(weakSelf) strongSelf = weakSelf;
			
			dispatch_sync(_timersObservationQueue, ^{
				_WXJSTimingObservationWrapper* _observationWrapper = [strongSelf->_observations objectForKey:_self];
				
				if(_observationWrapper == nil)
				{
					_observationWrapper = [[_WXJSTimingObservationWrapper alloc] initWithTimers:[_self valueForKey:@"_timers"]];
					[_self setValue:_observationWrapper forKey:@"_timers"];
					[strongSelf->_observations setObject:_observationWrapper forKey:_self];
				}
				
				
				if(duration > 0 && duration <= _durationThreshold && repeats == NO)
				{
					NSLog(@"☣️ DETOX:: Observing timer: %@ d: %@ r: %@", timerID, @(duration), @(repeats));
					
					[_observationWrapper addObservedTimer:timerID];
				}
				else
				{
					NSLog(@"☣️ DETOX:: Ignoring timer: %@ failure reason: \"%@\"", timerID, [strongSelf failuireReasonForDuration:duration repeats:repeats]);
				}
			});
			
			orig_createTimer(_self, createTimerSel, timerID, duration, jsDate, repeats);
		}));
	}
	return self;
}

- (BOOL)isIdleNow
{
	__block BOOL rv = YES;
	
	dispatch_sync(_timersObservationQueue, ^{
		NSUInteger observedTimersCount = 0;
		
		for(_WXJSTimingObservationWrapper* wrapper in _observations.objectEnumerator)
		{
			observedTimersCount += wrapper.countOfObservedTimers;
		}
		
		rv = observedTimersCount == 0;
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
