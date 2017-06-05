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

__attribute__((constructor))
void setupForTests()
{
	__currentIdlingResourceSerialQueue = dispatch_queue_create("__currentIdlingResourceSerialQueue", NULL);
	
	//Cannot just extern this function - we are not linked with RN, so linker will fail. Instead, look for symbol in runtime.
	dispatch_queue_t (*RCTGetUIManagerQueue)(void) = dlsym(RTLD_DEFAULT, "RCTGetUIManagerQueue");
	
	if(RCTGetUIManagerQueue == NULL)
	{
		return;
	}
	
	//Must be performed in +load and not in +setUp in order to correctly catch the ui queue, runloop and display link initialization by RN.
	dispatch_queue_t queue = RCTGetUIManagerQueue();
	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[GREYDispatchQueueIdlingResource resourceWithDispatchQueue:queue name:@"RCTUIManagerQueue"]];
	
	Class cls = NSClassFromString(@"RCTJSCExecutor");
	Method m = class_getClassMethod(cls, NSSelectorFromString(@"runRunLoopThread"));
	orig_runRunLoopThread = (void(*)(id, SEL))method_getImplementation(m);
	method_setImplementation(m, (IMP)swz_runRunLoopThread);
	
//	cls = NSClassFromString(@"RCTDisplayLink");
//	m = class_getInstanceMethod(cls, NSSelectorFromString(@"addToRunLoop:"));
//	orig_addToRunLoop = (void(*)(id, SEL, NSRunLoop*))method_getImplementation(m);
//	method_setImplementation(m, (IMP)swz_addToRunLoop);

	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[WXJSTimerObservationIdlingResource new]];
	
//	[[GREYUIThreadExecutor sharedInstance] registerIdlingResource:[WXAnimatedDisplayLinkIdlingResource new]];
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
