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

@import ObjectiveC;
@import Darwin;

NSString *const RCTReloadNotification = @"RCTReloadNotification";

static dispatch_queue_t __currentIdlingResourceSerialQueue;

static WXRunLoopIdlingResource* __current_runLoopIdlingResource;
static void (*orig_runRunLoopThread)(id, SEL) = NULL;
static void swz_runRunLoopThread(id self, SEL _cmd)
{
	dispatch_sync(__currentIdlingResourceSerialQueue, ^{
		if(__current_runLoopIdlingResource)
		{
			[[GREYUIThreadExecutor sharedInstance] deregisterIdlingResource:__current_runLoopIdlingResource];
			__current_runLoopIdlingResource = nil;
		}
	
		__current_runLoopIdlingResource = [[WXRunLoopIdlingResource alloc] initWithRunLoop:CFRunLoopGetCurrent()];
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
			[[GREYUIThreadExecutor sharedInstance] deregisterIdlingResource:__original_displayLinkIdlingResource];
			__original_displayLinkIdlingResource = nil;
		}
		
		__original_displayLinkIdlingResource = [[WXJSDisplayLinkIdlingResource alloc] initWithDisplayLink:[self valueForKey:@"jsDisplayLink"]];
		[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:__original_displayLinkIdlingResource];
	});
	
	orig_addToRunLoop(self, _cmd, runloop);
}

static NSMutableArray* __observedQueues;

__attribute__((constructor))
void setupForTests()
{
	__currentIdlingResourceSerialQueue = dispatch_queue_create("__currentIdlingResourceSerialQueue", NULL);

	Class cls = NSClassFromString(@"RCTModuleData");
	if(cls == nil)
	{
		return;
	}
	
	__observedQueues = [NSMutableArray new];
	
	//Add an idling resource for each module queue.
	Method m = class_getInstanceMethod(cls, NSSelectorFromString(@"setUpMethodQueue"));
	void(*orig_setUpMethodQueue_imp)(id, SEL) = (void(*)(id, SEL))method_getImplementation(m);
	method_setImplementation(m, imp_implementationWithBlock(^(id _self) {
		orig_setUpMethodQueue_imp(_self, NSSelectorFromString(@"setUpMethodQueue"));
		
		dispatch_queue_t queue = object_getIvar(_self, class_getInstanceVariable(cls, "_methodQueue"));
		
		if(queue != nil && [queue isKindOfClass:[NSNull class]] == NO && queue != dispatch_get_main_queue() && [__observedQueues containsObject:queue] == NO)
		{
			NSString* queueName = [[NSString alloc] initWithUTF8String:dispatch_queue_get_label(queue) ?: ""];
			
			[__observedQueues addObject:queue];
			
			NSLog(@"☣️ Adding idling resource for queue: %@", queue);
			
			
			[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[GREYDispatchQueueIdlingResource resourceWithDispatchQueue:queue name:queueName ?: @"SomeReactQueue"]];
		}
	}));
	
	//Cannot just extern this function - we are not linked with RN, so linker will fail. Instead, look for symbol in runtime.
	dispatch_queue_t (*RCTGetUIManagerQueue)(void) = dlsym(RTLD_DEFAULT, "RCTGetUIManagerQueue");
	
	//Must be performed in +load and not in +setUp in order to correctly catch the ui queue, runloop and display link initialization by RN.
	dispatch_queue_t queue = RCTGetUIManagerQueue();
	[__observedQueues addObject:queue];
	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[GREYDispatchQueueIdlingResource resourceWithDispatchQueue:queue name:@"RCTUIManagerQueue"]];
	
	cls = NSClassFromString(@"RCTJSCExecutor");
	m = class_getClassMethod(cls, NSSelectorFromString(@"runRunLoopThread"));
	orig_runRunLoopThread = (void(*)(id, SEL))method_getImplementation(m);
	method_setImplementation(m, (IMP)swz_runRunLoopThread);
	
	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[WXJSTimerObservationIdlingResource new]];
}

@implementation ReactNativeSupport

+ (BOOL) isReactNativeApp
{
    return (NSClassFromString(@"RCTBridge") != nil);
}

+ (void) reloadApp
{
	if(NSClassFromString(@"RCTBridge") == nil)
	{
		//Not RN app - noop.
		return;
	}
	
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
	
	observer = [[NSNotificationCenter defaultCenter] addObserverForName:@"RCTContentDidAppearNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
		
		if(handler)
		{
			handler();
		}
		
		[[NSNotificationCenter defaultCenter] removeObserver:observer];
	}];
}

@end
