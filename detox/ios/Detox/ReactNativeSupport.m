//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeSupport.h"
#import "ReactNativeHeaders.h"

#include <dlfcn.h>
#include <stdatomic.h>
#include "fishhook.h"
@import ObjectiveC;
@import Darwin;

DTX_CREATE_LOG(ReactNativeSupport);

static NSString *const RCTReloadNotification = @"RCTReloadNotification";

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
