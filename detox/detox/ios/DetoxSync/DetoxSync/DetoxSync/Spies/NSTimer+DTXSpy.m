//
//  NSTimer+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/28/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "NSTimer+DTXSpy.h"
#import "DTXTimerSyncResource.h"
#import "DTXSyncManager-Private.h"
#import "fishhook.h"

@import ObjectiveC;

@implementation NSTimer (DTXSpy)

static NSString* failuireReasonForTrampoline(id<DTXTimerProxy> trampoline, CFRunLoopRef rl)
{
	if([DTXSyncManager isRunLoopTracked:rl] == NO)
	{
		return @"untracked runloop";
	}
	else if(trampoline.repeats == YES)
	{
		return @"repeats==true";
	}
	else if([trampoline.fireDate timeIntervalSinceNow] > DTXSyncManager.maximumTimerIntervalTrackingDuration)
	{
		return [NSString stringWithFormat:@"duration>%@", @([trampoline.fireDate timeIntervalSinceNow])];
	}
	
	return @"";
}

static BOOL _DTXTrackTimerTrampolineIfNeeded(id<DTXTimerProxy> trampoline, CFRunLoopRef rl)
{
	if(trampoline != nil && [DTXSyncManager isRunLoopTracked:rl] && trampoline.repeats != YES && [trampoline.fireDate timeIntervalSinceNow] <= DTXSyncManager.maximumTimerIntervalTrackingDuration)
	{
		[trampoline track];
		return YES;
	}
	
	
	DTXSyncResourceVerboseLog(@"⏲ Ignoring timer “%@”; failure reason: \"%@\"", trampoline.timer, failuireReasonForTrampoline(trampoline, rl));
	
	return NO;
}

static void _DTXCFTimerTrampoline(CFRunLoopTimerRef timer, void *info)
{
//	NSLog(@"❤️ %p", timer);
	
	id<DTXTimerProxy> tp = [DTXTimerSyncResource existingTimerProxyWithTimer:NS(timer)];
	[tp fire:(__bridge NSTimer*)timer];
}

static CFRunLoopTimerRef (*__orig_CFRunLoopTimerCreate)(CFAllocatorRef allocator, CFAbsoluteTime fireDate, CFTimeInterval interval, CFOptionFlags flags, CFIndex order, CFRunLoopTimerCallBack callout, CFRunLoopTimerContext *context);
CFRunLoopTimerRef __detox_sync_CFRunLoopTimerCreate(CFAllocatorRef allocator, CFAbsoluteTime fireDate, CFTimeInterval interval, CFOptionFlags flags, CFIndex order, CFRunLoopTimerCallBack callout, CFRunLoopTimerContext *context)
{
	CFRunLoopTimerRef rv = __orig_CFRunLoopTimerCreate(allocator, fireDate, interval, flags, order, _DTXCFTimerTrampoline, context);
	
//	NSLog(@"❤️ %p", rv);
	
	id<DTXTimerProxy> trampoline = [DTXTimerSyncResource timerProxyWithCallback:callout fireDate:CFBridgingRelease(CFDateCreate(allocator, fireDate)) interval:interval repeats:interval > 0];

	[trampoline setTimer:(__bridge NSTimer*)rv];
	
	return rv;
}

static CFRunLoopTimerRef (*__orig_CFRunLoopTimerCreateWithHandler)(CFAllocatorRef allocator, CFAbsoluteTime fireDate, CFTimeInterval interval, CFOptionFlags flags, CFIndex order, void (^block) (CFRunLoopTimerRef timer));
CFRunLoopTimerRef __detox_sync_CFRunLoopTimerCreateWithHandler(CFAllocatorRef allocator, CFAbsoluteTime fireDate, CFTimeInterval interval, CFOptionFlags flags, CFIndex order, void (^block) (id timer))
{
	return (__bridge_retained CFRunLoopTimerRef)[[NSTimer alloc] initWithFireDate:CFBridgingRelease(CFDateCreate(allocator, fireDate)) interval:interval repeats:interval > 0 block:block];
}

static void (*__orig_CFRunLoopAddTimer)(CFRunLoopRef rl, CFRunLoopTimerRef timer, CFRunLoopMode mode);
void __detox_sync_CFRunLoopAddTimer(CFRunLoopRef rl, CFRunLoopTimerRef timer, CFRunLoopMode mode)
{
//	NSLog(@"🤦‍♂️ addTimer: %@", NS(timer));
	
	id<DTXTimerProxy> trampoline = [DTXTimerSyncResource existingTimerProxyWithTimer:NS(timer)];
	trampoline.runLoop = rl;
	
	_DTXTrackTimerTrampolineIfNeeded(trampoline, rl);
	
	__orig_CFRunLoopAddTimer(rl, timer, mode);
}

static void (*__orig_CFRunLoopRemoveTimer)(CFRunLoopRef rl, CFRunLoopTimerRef timer, CFRunLoopMode mode);
void __detox_sync_CFRunLoopRemoveTimer(CFRunLoopRef rl, CFRunLoopTimerRef timer, CFRunLoopMode mode)
{
//	NSLog(@"🤦‍♂️ removeTimer: %@", NS(timer));
	
	id<DTXTimerProxy> trampoline = [DTXTimerSyncResource existingTimerProxyWithTimer:NS(timer)];
	[trampoline untrack];
	
	__orig_CFRunLoopRemoveTimer(rl, timer, mode);
}

static void (*__orig_CFRunLoopTimerInvalidate)(CFRunLoopTimerRef timer);
void __detox_sync_CFRunLoopTimerInvalidate(CFRunLoopTimerRef timer)
{
//	NSLog(@"🤦‍♂️ invalidate: %@", NS(timer));
	
	id<DTXTimerProxy> trampoline = [DTXTimerSyncResource existingTimerProxyWithTimer:NS(timer)];
	[trampoline untrack];
	
	__orig_CFRunLoopTimerInvalidate(timer);
}

static void (*__orig___NSCFTimer_invalidate)(NSTimer* timer);
void __detox_sync___NSCFTimer_invalidate(NSTimer* timer)
{
	//	NSLog(@"🤦‍♂️ invalidate: %@", timer);
	
	id<DTXTimerProxy> trampoline = [DTXTimerSyncResource existingTimerProxyWithTimer:timer];
	[trampoline untrack];
	
	__orig___NSCFTimer_invalidate(timer);
}


+ (void)load
{
	@autoreleasepool
	{
		struct rebinding r[] = (struct rebinding[]) {
			"CFRunLoopAddTimer", __detox_sync_CFRunLoopAddTimer, (void*)&__orig_CFRunLoopAddTimer,
			"CFRunLoopRemoveTimer", __detox_sync_CFRunLoopRemoveTimer, (void*)&__orig_CFRunLoopRemoveTimer,
			"CFRunLoopTimerInvalidate", __detox_sync_CFRunLoopTimerInvalidate, (void*)&__orig_CFRunLoopTimerInvalidate,
			"CFRunLoopTimerCreate", __detox_sync_CFRunLoopTimerCreate, (void*)&__orig_CFRunLoopTimerCreate,
			"CFRunLoopTimerCreateWithHandler", __detox_sync_CFRunLoopTimerCreateWithHandler, (void*)&__orig_CFRunLoopTimerCreateWithHandler,
		};
		rebind_symbols(r, sizeof(r) / sizeof(struct rebinding));
	}
	
	Method m = class_getInstanceMethod(NSClassFromString(@"__NSCFTimer"), @selector(invalidate));
	__orig___NSCFTimer_invalidate = (void*)method_getImplementation(m);
	method_setImplementation(m, (void*)__detox_sync___NSCFTimer_invalidate);
}

@end
