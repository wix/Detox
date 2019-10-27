//
//  WXJSTimerObservationIdlingResource.m
//  Detox
//
//  Created by Leo Natan (Wix) on 14/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "WXJSTimerObservationIdlingResource.h"
@import ObjectiveC;

DTX_CREATE_LOG(WXJSTimerObservationIdlingResource)

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
		dtx_log_info(@"Removing observed timer %@", aKey);
		[_observedTimers removeObject:aKey];
	}
	
	[_timers removeObjectForKey:aKey];
}

@end

@implementation WXJSTimerObservationIdlingResource
{
	NSMapTable<id, _WXJSTimingObservationWrapper*>* _observations;
	NSTimeInterval _durationThreshold;
}

- (NSMapTable<id,id> *)observations
{
	return (id)_observations;
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
		
		// Check if the createTimer interface is using doubles or NSObjects.
		// Earlier versions of react native use NSObjects for the timer and
		// date params, while later versions use doubles for these.
		const char* timerArgType = [[cls instanceMethodSignatureForSelector:createTimerSel] getArgumentTypeAtIndex:2];
		if (strncmp(timerArgType, "d", 1) == 0)
		{
			void (*orig_createTimer)(id, SEL, double, NSTimeInterval, double, BOOL) = (void*)method_getImplementation(m);
			method_setImplementation(m, imp_implementationWithBlock(^(id _self, double timerID, NSTimeInterval duration, double jsDate, BOOL repeats) {
				__strong __typeof(weakSelf) strongSelf = weakSelf;
				[strongSelf attachObservation:_self timerID:@(timerID) duration:duration repeats:repeats];
				orig_createTimer(_self, createTimerSel, timerID, duration, jsDate, repeats);
			}));
		}
		else
		{
			void (*orig_createTimer)(id, SEL, NSNumber*, NSTimeInterval, NSDate*, BOOL) = (void*)method_getImplementation(m);
			method_setImplementation(m, imp_implementationWithBlock(^(id _self, NSNumber* timerID, NSTimeInterval duration, NSDate* jsDate, BOOL repeats) {
				__strong __typeof(weakSelf) strongSelf = weakSelf;
				[strongSelf attachObservation:_self timerID:timerID duration:duration repeats:repeats];
				orig_createTimer(_self, createTimerSel, timerID, duration, jsDate, repeats);
			}));
		}
	}
	return self;
}

- (void)attachObservation:(id)_self timerID:(NSNumber *)timerID duration:(NSTimeInterval)duration repeats:(BOOL)repeats
{
	dispatch_sync(_timersObservationQueue, ^{
		_WXJSTimingObservationWrapper* _observationWrapper = [self->_observations objectForKey:_self];
		
		if(_observationWrapper == nil)
		{
			_observationWrapper = [[_WXJSTimingObservationWrapper alloc] initWithTimers:[_self valueForKey:@"_timers"]];
			[_self setValue:_observationWrapper forKey:@"_timers"];
			[self->_observations setObject:_observationWrapper forKey:_self];
		}
		
		if(duration > 0 && duration <= _durationThreshold && repeats == NO)
		{
			dtx_log_info(@"Observing timer: %@ d: %@ r: %@", timerID, @(duration), @(repeats));
			[_observationWrapper addObservedTimer:timerID];
		}
		else
		{
			dtx_log_info(@"Ignoring timer: %@ failure reason: \"%@\"", timerID, [self failuireReasonForDuration:duration repeats:repeats]);
		}
	});
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
