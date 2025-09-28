//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeSupport.h"
#import "ReactNativeHeaders.h"
#import "DetoxSwiftBridge.h"

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
    NSObject *reactHost = [self getReactHost];

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

+ (NSObject *) getReactHost {
    NSObject<UIApplicationDelegate> *appDelegate = UIApplication.sharedApplication.delegate;
    
    NSObject *rootViewFactory = nil;
    
    rootViewFactory = [DetoxSwiftBridge getRootViewFactory];
    if (rootViewFactory != nil) {
        return [rootViewFactory valueForKey:@"reactHost"];
    }
    
    @try {
        rootViewFactory = [appDelegate valueForKey:@"rootViewFactory"];
    } @catch (NSException *exception) {
        @try {
            NSObject *reactNativeFactory = [appDelegate valueForKey:@"reactNativeFactory"];
            rootViewFactory = [reactNativeFactory valueForKey:@"rootViewFactory"];
        } @catch (NSException *exception) {
            [NSException raise:@"Invalid AppDelegate" format:@"Could not access rootViewFactory. Make sure your AppDelegate either: Inherits from RCTAppDelegate or defines 'reactNativeFactory'" ];
        }
    }
    return [rootViewFactory valueForKey:@"reactHost"];
}


@end
