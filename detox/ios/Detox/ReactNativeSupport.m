//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeSupport.h"
#import "ReactNativeHeaders.h"

#import "EarlGreyExtensions.h"

#import "WXRunLoopIdlingResource.h"
#import "WXJSDisplayLinkIdlingResource.h"
#import "WXJSTimerObservationIdlingResource.h"
#import "WXAnimatedDisplayLinkIdlingResource.h"
#import "WXRNLoadIdlingResource.h"

#include <dlfcn.h>
#include <stdatomic.h>
#include <fishhook.h>
@import ObjectiveC;
@import Darwin;

DTX_CREATE_LOG(ReactNativeSupport);

static NSString *const RCTReloadNotification = @"RCTReloadNotification";

static dispatch_queue_t __currentIdlingResourceSerialQueue;

_Atomic(CFRunLoopRef) __RNRunLoop;
_Atomic(const void*) __RNThread;
static WXRunLoopIdlingResource* __current_runLoopIdlingResource;
static void (*orig_runRunLoopThread)(id, SEL) = NULL;
static void swz_runRunLoopThread(id self, SEL _cmd)
{
	CFRunLoopRef current = CFRunLoopGetCurrent();
	atomic_store(&__RNRunLoop, current);
	
	//This will take the old thread and release it by transfering ownership to ObjC.
	NSThread* oldThread = CFBridgingRelease(atomic_load(&__RNThread));
	oldThread = nil;
	
	atomic_store(&__RNThread, CFBridgingRetain([NSThread currentThread]));
	
	dispatch_sync(__currentIdlingResourceSerialQueue, ^{
		if(__current_runLoopIdlingResource)
		{
			dtx_log_info(@"Removing idling resource for JS runloop");
			
			[[GREYUIThreadExecutor sharedInstance] deregisterIdlingResource:__current_runLoopIdlingResource];
			__current_runLoopIdlingResource = nil;
		}
	
		dtx_log_info(@"Adding idling resource for JS runloop");
		
		__current_runLoopIdlingResource = [[WXRunLoopIdlingResource alloc] initWithRunLoop:current];
		[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:__current_runLoopIdlingResource];
	});
	
	orig_runRunLoopThread(self, _cmd);
}

static WXJSDisplayLinkIdlingResource* __original_displayLinkIdlingResource;
void (*orig_addToRunLoop)(id, SEL, NSRunLoop*) = NULL;
void swz_addToRunLoop(id self, SEL _cmd, NSRunLoop* runloop)
{
	dispatch_sync(__currentIdlingResourceSerialQueue, ^{
		if(__original_displayLinkIdlingResource)
		{
			dtx_log_info(@"Removing idling resource for display link");
			
			[[GREYUIThreadExecutor sharedInstance] deregisterIdlingResource:__original_displayLinkIdlingResource];
			__original_displayLinkIdlingResource = nil;
		}
		
		dtx_log_info(@"Adding idling resource for display link");
		
		__original_displayLinkIdlingResource = [[WXJSDisplayLinkIdlingResource alloc] initWithDisplayLink:[self valueForKey:@"jsDisplayLink"]];
		[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:__original_displayLinkIdlingResource];
	});
	
	orig_addToRunLoop(self, _cmd, runloop);
}

static NSMutableArray* __observedQueues;
static NSMutableArray* __currentDispatchQueueIdlingResources;

static dispatch_queue_t (*wx_original_dispatch_queue_create)(const char *_Nullable label, dispatch_queue_attr_t _Nullable attr);

dispatch_queue_t wx_dispatch_queue_create(const char *_Nullable label, dispatch_queue_attr_t _Nullable attr)
{
	dispatch_queue_t rv = wx_original_dispatch_queue_create(label, attr);
	
	if(label != NULL && strncmp(label, "com.apple.NSURLSession-work", strlen("com.apple.NSURLSession-work")) == 0)
	{
		dtx_log_info(@"Adding idling resource for network queue: %@", rv);
		
		[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[GREYDispatchQueueIdlingResource resourceWithDispatchQueue:rv name:@"com.apple.NSURLSession-work"]];
	}
	
	return rv;
}

static int (*__detox_run_orig)(id self, SEL _cmd);
static int __detox_run(id self, SEL _cmd)
{
	Class cls = NSClassFromString(@"RCTJSCExecutor");
	Method m = NULL;
	if(cls != NULL)
	{
		//Legacy RN
		m = class_getClassMethod(cls, NSSelectorFromString(@"runRunLoopThread"));
		dtx_log_info(@"Found legacy class RCTJSCExecutor");
	}
	else
	{
		//Modern RN
		cls = NSClassFromString(@"RCTCxxBridge");
		m = class_getClassMethod(cls, NSSelectorFromString(@"runRunLoop"));
		if(m == NULL)
		{
			m = class_getInstanceMethod(cls, NSSelectorFromString(@"runJSRunLoop"));
			dtx_log_info(@"Found modern class RCTCxxBridge, method runJSRunLoop");
		}
		else
		{
			dtx_log_info(@"Found modern class RCTCxxBridge, method runRunLoop");
		}
	}
	
	if(m != NULL)
	{
		orig_runRunLoopThread = (void(*)(id, SEL))method_getImplementation(m);
		method_setImplementation(m, (IMP)swz_runRunLoopThread);
	}
	else
	{
		dtx_log_info(@"Method runRunLoop not found");
	}
	
	return __detox_run_orig(self, _cmd);
}

__attribute__((constructor))
static void __setupRNSupport()
{
	wx_original_dispatch_queue_create = dlsym(RTLD_DEFAULT, "dispatch_queue_create");
	
	// Rebind symbols dispatch_queue_create to point to our own implementation.
	rebind_symbols((struct rebinding[]){"dispatch_queue_create", wx_dispatch_queue_create, NULL}, 1);
	
	__currentIdlingResourceSerialQueue = dispatch_queue_create("__currentIdlingResourceSerialQueue", NULL);

	Class cls = NSClassFromString(@"RCTModuleData");
	if(cls == nil)
	{
		return;
	}
	
	__observedQueues = [NSMutableArray new];
	__currentDispatchQueueIdlingResources = [NSMutableArray new];
	
	//Add an idling resource for each module queue.
	Method m = class_getInstanceMethod(cls, NSSelectorFromString(@"setUpMethodQueue"));
	void(*orig_setUpMethodQueue_imp)(id, SEL) = (void(*)(id, SEL))method_getImplementation(m);
	method_setImplementation(m, imp_implementationWithBlock(^(id _self) {
		orig_setUpMethodQueue_imp(_self, NSSelectorFromString(@"setUpMethodQueue"));
		
		dispatch_queue_t queue = object_getIvar(_self, class_getInstanceVariable(cls, "_methodQueue"));
		
		dispatch_sync(__currentIdlingResourceSerialQueue, ^{
			if(queue != nil && [queue isKindOfClass:[NSNull class]] == NO && queue != dispatch_get_main_queue() && [__observedQueues containsObject:queue] == NO)
			{
				NSString* queueName = [[NSString alloc] initWithUTF8String:dispatch_queue_get_label(queue) ?: ""];
				
				[__observedQueues addObject:queue];
				
				dtx_log_info(@"Adding idling resource for queue: %@", queue);
				
				GREYDispatchQueueIdlingResource* ir = [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:queue name:queueName ?: @"SomeReactQueue"];
				[__currentDispatchQueueIdlingResources addObject:ir];
				[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:ir];
			}
		});
	}));
	
	//Cannot just extern this function - we are not linked with RN, so linker will fail. Instead, look for symbol in runtime.
	dispatch_queue_t (*RCTGetUIManagerQueue)(void) = dlsym(RTLD_DEFAULT, "RCTGetUIManagerQueue");
	
	//Must be performed in +load and not in +setUp in order to correctly catch the ui queue, runloop and display link initialization by RN.
	dispatch_queue_t queue = RCTGetUIManagerQueue();
	[__observedQueues addObject:queue];
	
	dtx_log_info(@"Adding idling resource for RCTUIManagerQueue");
	
	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[GREYDispatchQueueIdlingResource resourceWithDispatchQueue:queue name:@"RCTUIManagerQueue"]];

	m = class_getInstanceMethod(UIApplication.class, NSSelectorFromString(@"_run"));
	__detox_run_orig = (void*)method_getImplementation(m);
	method_setImplementation(m, (void*)__detox_run);
	
	dtx_log_info(@"Adding idling resource for JS timers");
	
	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[WXJSTimerObservationIdlingResource new]];
	
	dtx_log_info(@"Adding idling resource for RN load");
	
	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[WXRNLoadIdlingResource new]];
	
	if([WXAnimatedDisplayLinkIdlingResource isAvailable]) {
		dtx_log_info(@"Adding idling resource for Animated display link");
		
		[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[WXAnimatedDisplayLinkIdlingResource new]];
	}
}

@implementation ReactNativeSupport

+ (BOOL) isReactNativeApp
{
    return (NSClassFromString(@"RCTBridge") != nil);
}

+ (void)reloadApp
{
	if(NSClassFromString(@"RCTBridge") == nil)
	{
		//Not RN app - noop.
		return;
	}
	
	dispatch_sync(__currentIdlingResourceSerialQueue, ^{
		[__currentDispatchQueueIdlingResources enumerateObjectsUsingBlock:^(GREYDispatchQueueIdlingResource* _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
			dtx_log_info(@"Removing idling resource for queue: %@", [obj valueForKeyPath:@"dispatchQueueTracker.dispatchQueue"]);
			
			[[GREYUIThreadExecutor sharedInstance] deregisterIdlingResource:obj];
		}];
		
		[__currentDispatchQueueIdlingResources removeAllObjects];
		[__observedQueues removeAllObjects];
	});
	
	id<RN_RCTBridge> bridge = [NSClassFromString(@"RCTBridge") valueForKey:@"currentBridge"];
	
	SEL reqRelSel = NSSelectorFromString(@"requestReload");
	if([bridge respondsToSelector:reqRelSel])
	{
		//Call RN public API to request reload.
		[bridge requestReload];
	}
	else
	{
		//Legacy call to reload RN.
		[[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
															object:nil
														  userInfo:nil];
	}
}

+ (void)waitForReactNativeLoadWithCompletionHandler:(void (^)(void))handler
{
	__block __weak id observer;
	
	observer = [[NSNotificationCenter defaultCenter] addObserverForName:@"RCTJavaScriptDidLoadNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
		if(handler)
		{
			handler();
		}
		
		[[NSNotificationCenter defaultCenter] removeObserver:observer];
	}];
}

@end
