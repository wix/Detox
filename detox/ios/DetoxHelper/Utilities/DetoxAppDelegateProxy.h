//
//  DetoxAppDelegateProxy.h
//  Detox
//
//  Created by Leo Natan (Wix) on 19/01/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

@import Foundation;
@import UIKit;

@interface DetoxAppDelegateProxy : NSObject <UIApplicationDelegate>

@property (class, nonatomic) BOOL disableTouchIndicators;
@property (class, nonatomic) BOOL enableVerboseLogging;
@property (class, nonatomic, strong, readonly) DetoxAppDelegateProxy* sharedAppDelegateProxy;

+ (void)setLaunchUserActivity:(NSDictionary*)userActivity;
+ (void)setLaunchUserNotification:(NSDictionary*)userNotification;
+ (void)setLaunchOpenURL:(NSDictionary*)URL options:(NSDictionary*)options;

- (void)dispatchUserActivity:(NSDictionary*)userActivity delayUntilActive:(BOOL)delay;
- (void)dispatchUserNotification:(NSDictionary*)userNotification delayUntilActive:(BOOL)delay;
- (void)dispatchOpenURL:(NSURL*)URL options:(NSDictionary*)options delayUntilActive:(BOOL)delay;

@end
