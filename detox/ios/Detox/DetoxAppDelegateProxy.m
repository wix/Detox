//
//  DetoxAppDelegateProxy.m
//  Detox
//
//  Created by Leo Natan (Wix) on 19/01/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "DetoxAppDelegateProxy.h"
@import ObjectiveC;
@import UIKit;
@import UserNotifications;

#import <Detox/Detox-Swift.h>

@class DetoxAppDelegateProxy;

static DetoxAppDelegateProxy* _currentAppDelegateProxy;

@interface DetoxAppDelegateProxy () <UIApplicationDelegate>
@end

@implementation DetoxAppDelegateProxy

+ (instancetype)currentAppDelegateProxy
{
	return _currentAppDelegateProxy;
}

+ (void)load
{
	Method m = class_getInstanceMethod([UIApplication class], @selector(setDelegate:));
	void (*orig)(id, SEL, id<UIApplicationDelegate>) = (void*)method_getImplementation(m);
	method_setImplementation(m, imp_implementationWithBlock(^ (id _self, id<UIApplicationDelegate> origDelegate) {
		//Only create a dupe class if the provided instance is not already a dupe class.
		if(origDelegate != nil && [origDelegate respondsToSelector:@selector(__dtx_canaryInTheCoalMine)] == NO)
		{
			
			NSString* clsName = [NSString stringWithFormat:@"%@(%@)", NSStringFromClass([origDelegate class]), NSStringFromClass([DetoxAppDelegateProxy class])];
			Class cls = objc_getClass(clsName.UTF8String);
			
			if(cls == nil)
			{
				cls = objc_duplicateClass([DetoxAppDelegateProxy class], clsName.UTF8String, 0);
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
				class_setSuperclass(cls, origDelegate.class);
#pragma clang diagnostic pop
			}
			
			object_setClass(origDelegate, cls);
			
			[[NSNotificationCenter defaultCenter] addObserver:origDelegate selector:@selector(__dtx_applicationDidLaunchNotification:) name:UIApplicationDidFinishLaunchingNotification object:nil];
		}
		
		_currentAppDelegateProxy = origDelegate;
		orig(_self, @selector(setDelegate:), origDelegate);
	}));
}

- (void)__dtx_canaryInTheCoalMine {}

- (void)__dtx_applicationDidLaunchNotification:(NSNotification*)notification
{
	[self.userNotificationDispatcher dispatchOnAppDelegate:self simulateDuringLaunch:YES];
}

- (NSURL*)_userNotificationDataURL
{
	NSString* userNotificationDataPath = [[NSUserDefaults standardUserDefaults] objectForKey:@"detoxUserNotificationDataURL"];
	
	if(userNotificationDataPath == nil)
	{
		return nil;
	}
	
	return [NSURL fileURLWithPath:userNotificationDataPath];
}

- (NSURL*)_URLOverride
{
	return [NSURL URLWithString:[[NSUserDefaults standardUserDefaults] objectForKey:@"detoxURLOverride"]];
}

- (NSString*)_sourceAppOverride
{
	return [[NSUserDefaults standardUserDefaults] objectForKey:@"detoxSourceAppOverride"];
}

- (NSDictionary*)_prepareLaunchOptions:(NSDictionary*)launchOptions userNotificationDispatcher:(DetoxUserNotificationDispatcher*)dispatcher
{
	NSMutableDictionary* rv = [launchOptions mutableCopy] ?: [NSMutableDictionary new];
	
	if(dispatcher)
	{
		rv[UIApplicationLaunchOptionsRemoteNotificationKey] = [dispatcher remoteNotification];
	}
	else
	{
		NSURL* openURLOverride = [self _URLOverride];
		if(openURLOverride)
		{
			rv[UIApplicationLaunchOptionsURLKey] = openURLOverride;
		}
		NSString* originalAppOverride = [self _sourceAppOverride];
		if(originalAppOverride)
		{
			rv[UIApplicationLaunchOptionsSourceApplicationKey] = originalAppOverride;
		}
	}
	
	return rv;
}

- (DetoxUserNotificationDispatcher*)userNotificationDispatcher
{
	DetoxUserNotificationDispatcher* rv = objc_getAssociatedObject(self, _cmd);
	
	if([self _userNotificationDataURL])
	{
		rv = [[DetoxUserNotificationDispatcher alloc] initWithUserNotificationDataURL:[self _userNotificationDataURL]];
		objc_setAssociatedObject(self, _cmd, rv, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	}
	
	return rv;
}

- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id>*)launchOptions
{
	launchOptions = [self _prepareLaunchOptions:launchOptions userNotificationDispatcher:self.userNotificationDispatcher];
	
	BOOL rv = YES;
	if([class_getSuperclass(object_getClass(self)) instancesRespondToSelector:_cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = class_getSuperclass(object_getClass(self))};
		BOOL (*super_class)(struct objc_super*, SEL, id, id) = (void*)objc_msgSendSuper;
		rv = super_class(&super, _cmd, application, launchOptions);
	}
	
	return rv;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id> *)launchOptions
{
	launchOptions = [self _prepareLaunchOptions:launchOptions userNotificationDispatcher:self.userNotificationDispatcher];
	
	BOOL rv = YES;
	if([class_getSuperclass(object_getClass(self)) instancesRespondToSelector:_cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = class_getSuperclass(object_getClass(self))};
		BOOL (*super_class)(struct objc_super*, SEL, id, id) = (void*)objc_msgSendSuper;
		rv = super_class(&super, _cmd, application, launchOptions);
	}
	
	if(self.userNotificationDispatcher == nil && [self _URLOverride] && [class_getSuperclass(object_getClass(self)) instancesRespondToSelector:@selector(application:openURL:options:)])
	{
		[self application:application openURL:[self _URLOverride] options:launchOptions];
	}
	
	return rv;
}

@end
