//
//  _DTXTimerTrampoline.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/9/20.
//  Copyright © 2020 wix. All rights reserved.
//

#import "_DTXTimerTrampoline.h"
#import "DTXTimerSyncResource-Private.h"
#import "DTXSyncManager-Private.h"

const void* __DTXTimerTrampolineKey = &__DTXTimerTrampolineKey;

@implementation _DTXTimerTrampoline
{
	id _target;
	SEL _sel;
	
	//NSTimer
	__weak NSTimer* _timer;
	CFRunLoopTimerCallBack _callback;
	CFRunLoopRef _runLoop;
	NSString* _timerDescription;
	NSTimeInterval _timeUntilFire;
	
	//CADisplayLink
	__weak CADisplayLink* _displayLink;
	
	BOOL _tracking;
	
#if DEBUG
	NSString* _history;
#endif
}

@synthesize name=_name;
@synthesize fireDate=_fireDate;
@synthesize interval=_ti;
@synthesize repeats=_repeats;
@synthesize timer=_timer;
@synthesize displayLink=_displayLink;
@synthesize runLoop=_runLoop;

- (instancetype)initWithTarget:(id)target selector:(SEL)selector fireDate:(NSDate*)fireDate interval:(NSTimeInterval)ti repeats:(BOOL)rep
{
	self = [super init];
	if(self)
	{
		_target = target;
		_sel = selector;
		_fireDate = fireDate;
		_timeUntilFire = [fireDate timeIntervalSinceNow];
		_ti = ti;
		_repeats = rep;
		
#if DEBUG
		_history = [NSString stringWithFormat:@"%@\n%@", NSStringFromSelector(_cmd), NSThread.callStackSymbols];
#endif
	}
	return self;
}

- (instancetype)initWithCallback:(CFRunLoopTimerCallBack)callback fireDate:(NSDate*)fireDate interval:(NSTimeInterval)ti repeats:(BOOL)rep
{
	self = [super init];
	if(self)
	{
		_callback = callback;
		_fireDate = fireDate;
		_timeUntilFire = [fireDate timeIntervalSinceNow];
		_ti = ti;
		_repeats = rep;
		
#if DEBUG
		_history = [NSString stringWithFormat:@"%@\n%@", NSStringFromSelector(_cmd), NSThread.callStackSymbols];
#endif
	}
	return self;
}

- (BOOL)isDead
{
	return (self.timer == nil && self.displayLink == nil) || (self.runLoop != nil && [DTXSyncManager isRunLoopTracked:self.runLoop] == NO);
}

- (void)dealloc
{
	[self untrack];
	
	objc_setAssociatedObject(_timer, __DTXTimerTrampolineKey, nil, OBJC_ASSOCIATION_RETAIN);
}

- (void)setTimer:(NSTimer*)timer
{
	_timer = timer;
	_timerDescription = [[timer debugDescription] copy];
	objc_setAssociatedObject(timer, __DTXTimerTrampolineKey, self, OBJC_ASSOCIATION_RETAIN);
	
#if DEBUG
	_history = [NSString stringWithFormat:@"%@\n%@", _history, [timer debugDescription]];
#endif
}

- (void)setDisplayLink:(CADisplayLink*)displayLink
{
	_displayLink = displayLink;
	objc_setAssociatedObject(_displayLink, __DTXTimerTrampolineKey, self, OBJC_ASSOCIATION_RETAIN_NONATOMIC);

#if DEBUG
	_history = [NSString stringWithFormat:@"%@\n%@", _history, [displayLink debugDescription]];
#endif
}

- (void)fire:(id)timer
{
	//This is to ensure the timer is still valid after fire.
	CFRunLoopRef runloop = CFRunLoopGetCurrent();
	CFRunLoopMode mode = CFRunLoopCopyCurrentMode(runloop);
	CFRunLoopPerformBlock(runloop, mode, ^{
		if(CFRunLoopTimerIsValid((__bridge CFRunLoopTimerRef)timer) == NO)
		{
			[self untrack];
			
			CFRelease(mode);
			
			return;
		}
		
		CFRunLoopPerformBlock(runloop, mode, ^{
			if(CFRunLoopTimerIsValid((__bridge CFRunLoopTimerRef)timer) == NO)
			{
				[self untrack];
				
				CFRelease(mode);
				
				return;
			}
			
			CFRelease(mode);
		});
	});
	
	if(_callback)
	{
		CFRunLoopTimerContext ctx;
		CFRunLoopTimerGetContext((__bridge CFRunLoopTimerRef)timer, &ctx);
		_callback((__bridge CFRunLoopTimerRef)timer, ctx.info);
		return;
	}
	
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
	[_target performSelector:_sel withObject:timer];
#pragma clang diagnostic pop
}

- (void)track
{
	if(_tracking == YES)
	{
		return;
	}
	
	_tracking = YES;
	[DTXTimerSyncResource.sharedInstance trackTimerTrampoline:self];
}

- (void)untrack
{
	if(_tracking == NO)
	{
		return;
	}
	
	//	NSLog(@"🤦‍♂️ untrack: %@", _timer);
	
	[DTXTimerSyncResource.sharedInstance untrackTimerTrampoline:self];
	_tracking = NO;
}

+ (NSDateFormatter*)_descriptionDateFormatter
{
	static NSDateFormatter* _dateFormatter;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		_dateFormatter = [NSDateFormatter new];
		_dateFormatter.locale = NSLocale.autoupdatingCurrentLocale;
		_dateFormatter.dateFormat = @"YYYY-MM-dd HH:mm:ss Z";
	});
	return _dateFormatter;
}

- (DTXBusyResource *)jsonDescription {
  return @{
    @"fire_date": _fireDate ? [_DTXTimerTrampoline._descriptionDateFormatter stringFromDate:_fireDate] : @"none",
    @"time_until_fire": @(_timeUntilFire),
    @"is_recurring": @(_repeats),
    @"repeat_interval": @(_ti)
  };
}

#if DEBUG
- (NSString*)history
{
	return _history;
}
#endif

@end
