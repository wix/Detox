//
//  DetoxAppDelegateProxy.m
//  Detox
//
//  Created by Leo Natan (Wix) on 19/01/2017.
//  Copyright © 2017 Leo Natan. All rights reserved.
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
{
	NSObject<UIApplicationDelegate>* _originalAppDelegate;
	DetoxUserNotificationDispatcher* _notificationDispatcher;
}

+ (instancetype)currentAppDelegateProxy
{
	return _currentAppDelegateProxy;
}

+ (void)load
{
	Method m = class_getInstanceMethod([UIApplication class], @selector(setDelegate:));
	void (*orig)(id, SEL, id<UIApplicationDelegate>) = (void*)method_getImplementation(m);
	method_setImplementation(m, imp_implementationWithBlock(^ (id _self, id<UIApplicationDelegate> origDelegate) {
		_currentAppDelegateProxy = [[DetoxAppDelegateProxy alloc] initWithOriginalAppDelegate:origDelegate];
		orig(_self, @selector(setDelegate:), _currentAppDelegateProxy);
	}));
}

- (instancetype)initWithOriginalAppDelegate:(id<UIApplicationDelegate>)originalAppDelegate
{
//	self = [super init];
	
	_originalAppDelegate = originalAppDelegate;
	
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_applicationDidLaunchNotification:) name:UIApplicationDidFinishLaunchingNotification object:nil];
	
	return self;
}

- (void)_applicationDidLaunchNotification:(NSNotification*)notification
{
	[self.userNotificationDispatcher dispatchOnAppDelegate:_originalAppDelegate isDuringLaunch:YES];
}

- (BOOL)respondsToSelector:(SEL)aSelector
{
	return [_originalAppDelegate respondsToSelector:aSelector];
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)sel
{
	NSMethodSignature* ms = [super methodSignatureForSelector:sel];
	return ms ?: [_originalAppDelegate methodSignatureForSelector:sel];
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
	[invocation invokeWithTarget:_originalAppDelegate];
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
	if(_notificationDispatcher) { return _notificationDispatcher; }
	
	if([self _userNotificationDataURL]) {
		_notificationDispatcher = [[DetoxUserNotificationDispatcher alloc] initWithUserNotificationDataURL:[self _userNotificationDataURL]];
	}
	
	return _notificationDispatcher;
}

- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id>*)launchOptions
{
	launchOptions = [self _prepareLaunchOptions:launchOptions userNotificationDispatcher:self.userNotificationDispatcher];
	
	return [_originalAppDelegate application:application willFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id> *)launchOptions
{
	launchOptions = [self _prepareLaunchOptions:launchOptions userNotificationDispatcher:self.userNotificationDispatcher];
	
	BOOL rv = [_originalAppDelegate application:application didFinishLaunchingWithOptions:launchOptions];
	
	if(self.userNotificationDispatcher == nil && [self _URLOverride] && [_originalAppDelegate respondsToSelector:@selector(application:openURL:options:)])
	{
		[_originalAppDelegate application:[UIApplication sharedApplication] openURL:[self _URLOverride] options:launchOptions];
	}
	
	return rv;
}

@end
