//
//  WXRunLoopIdlingResource.m
//  Detox
//
//  Created by Leo Natan (Wix) on 14/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "WXRunLoopIdlingResource.h"
#import <stdatomic.h>
#include <dlfcn.h>
#include <fishhook.h>

static atomic_uintmax_t __numberOfRunLoopBlocks = 0;

extern _Atomic(CFRunLoopRef) __RNRunLoop;

static void (*__orig_CFRunLoopPerformBlock)(CFRunLoopRef rl, CFTypeRef mode, void(^block)(void));
static void __dtx_CFRunLoopPerformBlock(CFRunLoopRef rl, CFTypeRef mode, void(^block)(void))
{
	CFRunLoopRef RNRunLoop = atomic_load(&__RNRunLoop);
	
	if(rl != RNRunLoop)
	{
		__orig_CFRunLoopPerformBlock(rl, mode, block);
		return;
	}
	
	atomic_fetch_add(&__numberOfRunLoopBlocks, 1);
	
	__orig_CFRunLoopPerformBlock(rl, mode, ^ {
		block();
		atomic_fetch_sub(&__numberOfRunLoopBlocks, 1);
	});
}

__attribute__((constructor))
static void __setupRNSupport()
{
	__orig_CFRunLoopPerformBlock = dlsym(RTLD_DEFAULT, "CFRunLoopPerformBlock");
	rebind_symbols((struct rebinding[]){"CFRunLoopPerformBlock", __dtx_CFRunLoopPerformBlock, NULL}, 1);
}

@implementation WXRunLoopIdlingResource
{
	id _runLoop;
	atomic_bool _isBusy;
}

- (NSString*)translateRunLoopActivity:(CFRunLoopActivity)act
{
    switch (act) {
        case kCFRunLoopEntry:
            return @"kCFRunLoopEntry";
        case kCFRunLoopExit:
            return @"kCFRunLoopExit";
        case kCFRunLoopBeforeTimers:
            return @"kCFRunLoopBeforeTimers";
        case kCFRunLoopBeforeSources:
            return @"kCFRunLoopBeforeSources";
        case kCFRunLoopAfterWaiting:
            return @"kCFRunLoopAfterWaiting";
        case kCFRunLoopBeforeWaiting:
            return @"kCFRunLoopBeforeWaiting";
        default:
            return @"----";
    }
}

- (instancetype)initWithRunLoop:(CFRunLoopRef)runLoop
{
	self = [super init];
	if(self)
	{
		_runLoop = (__bridge id)(runLoop);
		
		CFRunLoopAddObserver((__bridge CFRunLoopRef)_runLoop, CFRunLoopObserverCreateWithHandler(NULL, kCFRunLoopExit | kCFRunLoopBeforeWaiting | kCFRunLoopAfterWaiting, YES, 0, ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
			BOOL busy;
			//				dtx_log_info(@"Current runloop activity: %@", [self translateRunLoopActivity: activity]);
			if(activity == kCFRunLoopBeforeWaiting || activity == kCFRunLoopExit)
			{
				busy = NO;
			}
			else
			{
				busy = YES;
			}
			
			atomic_store(&_isBusy, busy);
			
		}), kCFRunLoopDefaultMode);
	}
	return self;
}

- (BOOL)isIdleNow
{
	return atomic_load(&_isBusy) == NO && atomic_load(&__numberOfRunLoopBlocks) == 0;
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
