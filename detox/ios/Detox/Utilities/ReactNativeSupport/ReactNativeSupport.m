//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeSupport.h"
#import "ReactNativeHeaders.h"
#import "UIKit/UIKit.h"

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
        return;
	}

    NSObject<UIApplicationDelegate> *delegate = UIApplication.sharedApplication.delegate;
    NSObject *rootViewFactory = [delegate valueForKey: @"rootViewFactory"];
    if (rootViewFactory) {
        NSObject *host = [rootViewFactory valueForKey:@"reactHost"];
        SEL didReceiveReloadCommand = NSSelectorFromString(@"didReceiveReloadCommand");
        if (host && [host respondsToSelector:didReceiveReloadCommand]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [host performSelector:didReceiveReloadCommand];
#pragma clang diagnostic pop
            return;
        }
    }

    //Legacy call to reload RN.
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                        object:nil
                                                      userInfo:nil];
}

+ (void)waitForReactNativeLoadWithCompletionHandler:(void (^)(void))handler
{
	[DTXReactNativeSupport waitForReactNativeLoadWithCompletionHandler:handler];
}

@end
