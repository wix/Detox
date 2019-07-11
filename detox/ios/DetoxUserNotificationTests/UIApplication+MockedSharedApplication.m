//
//  UIApplication+MockedSharedApplication.m
//  DetoxUserNotificationTests
//
//  Created by Leo Natan (Wix) on 7/11/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import "UIApplication+MockedSharedApplication.h"

static UIApplication* __mockApp;
static id<UIApplicationDelegate> __mockAppDelegate;

static UIApplicationState __applicationStateOverride;

@implementation UIApplication (MockedSharedApplication)

- (void)setApplicationState:(UIApplicationState)applicationState
{
	__applicationStateOverride = applicationState;
}

void DTXApplicationMock(NSString * _Nullable principalClassName, NSString * _Nullable delegateClassName)
{
	__mockApp = [NSClassFromString(principalClassName ?: @"UIApplication") alloc];
	__mockAppDelegate = [NSClassFromString(delegateClassName) new];
	__mockApp.delegate = __mockAppDelegate;
}

- (UIApplicationState)applicationState
{
	return __applicationStateOverride;
}

+ (UIApplication *)sharedApplication
{
	return __mockApp;
}

@end
