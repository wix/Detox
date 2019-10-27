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
#include "fishhook.h"
#import <pthread.h>
@import ObjectiveC;

DTX_CREATE_LOG(RunLoopIdlingResource);

static pthread_mutex_t __globalMutex;

static uintmax_t __numberOfRunLoopBlocks = 0;

extern _Atomic(CFRunLoopRef) __RNRunLoop;
extern _Atomic(const void*) __RNThread;

static void (*__orig_performSelector_onThread_withObject_waitUntilDone)(id self, SEL _cmd, SEL aSelector, NSThread* thr, id arg, BOOL wait);
static void __dtx_performSelector_onThread_withObject_waitUntilDone(id self, SEL _cmd, SEL aSelector, NSThread* thr, id arg, BOOL wait)
{
	NSThread* oldThread = (__bridge NSThread*)atomic_load(&__RNThread);
	if(thr == oldThread)
	{
		pthread_mutex_lock(&__globalMutex);
		__numberOfRunLoopBlocks += 1;
		pthread_mutex_unlock(&__globalMutex);
		
		dispatch_block_t oldArg = arg;
		arg = ^ {
			oldArg();
			pthread_mutex_lock(&__globalMutex);
			__numberOfRunLoopBlocks -= 1;
			pthread_mutex_unlock(&__globalMutex);
		};
	}
	
	__orig_performSelector_onThread_withObject_waitUntilDone(self, _cmd, aSelector, thr, arg, wait);
}

static void (*__orig_CFRunLoopPerformBlock)(CFRunLoopRef rl, CFTypeRef mode, void(^block)(void));
static void __dtx_CFRunLoopPerformBlock(CFRunLoopRef rl, CFTypeRef mode, void(^block)(void))
{
	CFRunLoopRef RNRunLoop = atomic_load(&__RNRunLoop);
	
	if(rl != RNRunLoop)
	{
		__orig_CFRunLoopPerformBlock(rl, mode, block);
		return;
	}
	
	pthread_mutex_lock(&__globalMutex);
	__numberOfRunLoopBlocks += 1;
	pthread_mutex_unlock(&__globalMutex);
	
	__orig_CFRunLoopPerformBlock(rl, mode, ^ {
		block();
		pthread_mutex_lock(&__globalMutex);
		__numberOfRunLoopBlocks -= 1;
		pthread_mutex_unlock(&__globalMutex);
	});
}

__attribute__((constructor))
static void __setupRNSupport()
{
	__orig_CFRunLoopPerformBlock = dlsym(RTLD_DEFAULT, "CFRunLoopPerformBlock");
	rebind_symbols((struct rebinding[]){"CFRunLoopPerformBlock", __dtx_CFRunLoopPerformBlock, NULL}, 1);
	
	Class cls = NSObject.class;
	Method m = class_getInstanceMethod(cls, @selector(performSelector:onThread:withObject:waitUntilDone:));
	__orig_performSelector_onThread_withObject_waitUntilDone = (void*)method_getImplementation(m);
	method_setImplementation(m, (void*)__dtx_performSelector_onThread_withObject_waitUntilDone);
	
	pthread_mutex_init(&__globalMutex, NULL);
}

@implementation WXRunLoopIdlingResource
{
	id _runLoop;
	BOOL _isBusyDefault;
}

- (NSString*)translateRunLoopActivity:(CFRunLoopActivity)act
{
	NSMutableString* rv = [NSMutableString new];
	
	if(act & kCFRunLoopEntry)
	{
		[rv appendString:@"kCFRunLoopEntry, "];
	}
	if(act & kCFRunLoopExit)
	{
		[rv appendString:@"kCFRunLoopExit, "];
	}
	if(act & kCFRunLoopBeforeTimers)
	{
		[rv appendString:@"kCFRunLoopBeforeTimers, "];
	}
	if(act & kCFRunLoopBeforeSources)
	{
		[rv appendString:@"kCFRunLoopBeforeSources, "];
	}
	if(act & kCFRunLoopAfterWaiting)
	{
		[rv appendString:@"kCFRunLoopAfterWaiting, "];
	}
	if(act & kCFRunLoopBeforeWaiting)
	{
		[rv appendString:@"kCFRunLoopBeforeWaiting, "];
	}
	
	if(rv.length == 0)
	{
		[rv appendString:@"----"];
	}
	
	return rv;
}

- (instancetype)initWithRunLoop:(CFRunLoopRef)runLoop
{
	self = [super init];
	if(self)
	{
		_runLoop = (__bridge id)(runLoop);
		
		CFRunLoopAddObserver((__bridge CFRunLoopRef)_runLoop, CFRunLoopObserverCreateWithHandler(NULL, kCFRunLoopEntry | kCFRunLoopBeforeTimers | kCFRunLoopBeforeSources | kCFRunLoopBeforeWaiting | kCFRunLoopAfterWaiting | kCFRunLoopExit, YES, 0, ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
			BOOL busy;
//			dtx_log_info(@"Current runloop activity: %@", [self translateRunLoopActivity: activity]);
			
			if(activity & kCFRunLoopBeforeWaiting || activity & kCFRunLoopExit)
			{
				busy = NO;
			}
			else
			{
				busy = YES;
			}
			
			pthread_mutex_lock(&__globalMutex);
			_isBusyDefault = busy;
			pthread_mutex_unlock(&__globalMutex);
			
		}), kCFRunLoopDefaultMode);
	}
	return self;
}

- (BOOL)isIdleNow
{
	BOOL isBusyDefault;
	uintmax_t numberOfRunLoopBlocks;
	
	pthread_mutex_lock(&__globalMutex);
	isBusyDefault = _isBusyDefault;
	numberOfRunLoopBlocks = __numberOfRunLoopBlocks;
	pthread_mutex_unlock(&__globalMutex);
	
	return isBusyDefault == NO && numberOfRunLoopBlocks == 0;
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
