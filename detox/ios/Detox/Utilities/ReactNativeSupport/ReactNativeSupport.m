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
    // Early return if React Native is not present
    if (![DTXReactNativeSupport hasReactNative]) {
        return;
    }

    // Try legacy reload approach (without new arch)
    id<RN_RCTBridge> bridge = [NSClassFromString(@"RCTBridge") valueForKey:@"currentBridge"];
    if ([bridge respondsToSelector:@selector(requestReload)]) {
        [bridge requestReload];
        return;
    }

    // Try New Architecture reload approach
    NSObject<UIApplicationDelegate> *appDelegate = UIApplication.sharedApplication.delegate;
    NSObject *rootViewFactory = [appDelegate valueForKey:@"rootViewFactory"];
    NSObject *reactHost = [rootViewFactory valueForKey:@"reactHost"];

    SEL reloadCommand = NSSelectorFromString(@"didReceiveReloadCommand");
    if (reactHost && [reactHost respondsToSelector:reloadCommand]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        [reactHost performSelector:reloadCommand];
#pragma clang diagnostic pop
        return;
    }

    // Fallback to legacy^2 reload approach
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                        object:nil
                                                      userInfo:nil];
}

+ (void)waitForReactNativeLoadWithCompletionHandler:(void (^)(void))handler
{
	[DTXReactNativeSupport waitForReactNativeLoadWithCompletionHandler:handler];
}

@end
