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
@import ObjectiveC;
@import Darwin;
#import <DetoxSync/DTXReactNativeSupport.h>

DTX_CREATE_LOG(ReactNativeSupport);

static NSString *const RCTReloadNotification = @"RCTReloadNotification";

@implementation ReactNativeSupport

+ (BOOL)isReactNativeApp
{
	return [DTXReactNativeSupport hasReactNative];
}

+ (void)reloadApp
{
	if([DTXReactNativeSupport hasReactNative] == NO)
	{
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
	[DTXReactNativeSupport waitForReactNativeLoadWithCompletionHandler:handler];
}

@end
