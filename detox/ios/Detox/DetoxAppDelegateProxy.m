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
@import COSTouchVisualizer;

#import <Detox/Detox-Swift.h>

@class DetoxAppDelegateProxy;

static DetoxAppDelegateProxy* _currentAppDelegateProxy;
static NSMutableArray<NSDictionary*>* _pendingOpenURLs;
static NSMutableArray<DetoxUserNotificationDispatcher*>* _pendingUserNotificationDispatchers;
static NSMutableArray<DetoxUserActivityDispatcher*>* _pendingUserActivityDispatchers;
static DetoxUserActivityDispatcher* _pendingLaunchUserActivityDispatcher;
static DetoxUserNotificationDispatcher* _pendingLaunchUserNotificationDispatcher;

static COSTouchVisualizerWindow* _touchVisualizerWindow;

static NSURL* _launchUserNotificationDataURL()
{
	NSString* userNotificationDataPath = [[NSUserDefaults standardUserDefaults] objectForKey:@"detoxUserNotificationDataURL"];
	
	if(userNotificationDataPath == nil)
	{
		return nil;
	}
	
	return [NSURL fileURLWithPath:userNotificationDataPath];
}

static NSURL* _launchUserActivityDataURL()
{
	NSString* userActivityDataPath = [[NSUserDefaults standardUserDefaults] objectForKey:@"detoxUserActivityDataURL"];
	
	if(userActivityDataPath == nil)
	{
		return nil;
	}
	
	return [NSURL fileURLWithPath:userActivityDataPath];
}

@interface UIWindow (DTXEventProxy) @end

@implementation UIWindow (DTXEventProxy)

+ (void)load
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		Method m1 = class_getInstanceMethod(self, @selector(sendEvent:));
		Method m2 = class_getInstanceMethod(self, @selector(__dtx_sendEvent:));
		method_exchangeImplementations(m1, m2);
	});
}

- (void)__dtx_sendEvent:(UIEvent *)event
{
	if([self isKindOfClass:[COSTouchVisualizerWindow class]])
	{
		return;
	}
	
	[_touchVisualizerWindow sendEvent:event];
	[self __dtx_sendEvent:event];
}

@end

@interface DetoxAppDelegateProxy () <UIApplicationDelegate, COSTouchVisualizerWindowDelegate> @end

@implementation DetoxAppDelegateProxy

+ (instancetype)currentAppDelegateProxy
{
	return _currentAppDelegateProxy;
}

static void __copyMethods(Class orig, Class target)
{
	//Copy class methods
	Class targetMetaclass = object_getClass(target);
	
	unsigned int methodCount = 0;
	Method *methods = class_copyMethodList(object_getClass(orig), &methodCount);
	
	for (unsigned int i = 0; i < methodCount; i++)
	{
		Method method = methods[i];
		if(strcmp(sel_getName(method_getName(method)), "load") == 0 || strcmp(sel_getName(method_getName(method)), "initialize") == 0)
		{
			continue;
		}
		class_addMethod(targetMetaclass, method_getName(method), method_getImplementation(method), method_getTypeEncoding(method));
	}
	
	free(methods);
	
	//Copy instance methods
	methods = class_copyMethodList(orig, &methodCount);
	
	for (unsigned int i = 0; i < methodCount; i++)
	{
		Method method = methods[i];
		class_addMethod(target, method_getName(method), method_getImplementation(method), method_getTypeEncoding(method));
	}
	
	free(methods);
}

+ (void)load
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		_pendingOpenURLs = [NSMutableArray new];
		_pendingUserNotificationDispatchers = [NSMutableArray new];
		_pendingUserActivityDispatchers = [NSMutableArray new];
		
		NSURL* url = _launchUserActivityDataURL();
		if(url)
		{
			_pendingLaunchUserActivityDispatcher = [[DetoxUserActivityDispatcher alloc] initWithUserActivityDataURL:url];
		}
		
		url = _launchUserNotificationDataURL();
		if(url)
		{
			_pendingLaunchUserNotificationDispatcher = [[DetoxUserNotificationDispatcher alloc] initWithUserNotificationDataURL:url];
		}
		
		Method m = class_getInstanceMethod([UIApplication class], @selector(setDelegate:));
		void (*orig)(id, SEL, id<UIApplicationDelegate>) = (void*)method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^ (id _self, id<UIApplicationDelegate, COSTouchVisualizerWindowDelegate> origDelegate) {
			//Only create a dupe class if the provided instance is not already a dupe class.
			if(origDelegate != nil && [origDelegate respondsToSelector:@selector(__dtx_canaryInTheCoalMine)] == NO)
			{
				NSString* clsName = [NSString stringWithFormat:@"%@(%@)", NSStringFromClass([origDelegate class]), NSStringFromClass([DetoxAppDelegateProxy class])];
				Class cls = objc_getClass(clsName.UTF8String);
				
				if(cls == nil)
				{
					cls = objc_allocateClassPair(origDelegate.class, clsName.UTF8String, 0);
					__copyMethods([DetoxAppDelegateProxy class], cls);
					objc_registerClassPair(cls);
				}
				
				object_setClass(origDelegate, cls);
				
				[[NSNotificationCenter defaultCenter] addObserver:origDelegate selector:@selector(__dtx_applicationDidLaunchNotification:) name:UIApplicationDidFinishLaunchingNotification object:nil];
			}
			
			_currentAppDelegateProxy = origDelegate;
			orig(_self, @selector(setDelegate:), origDelegate);
		}));
	});
}

- (void)__dtx_canaryInTheCoalMine {}

- (void)__dtx_applicationDidLaunchNotification:(NSNotification*)notification
{
	dispatch_async(dispatch_get_main_queue(), ^{
		_touchVisualizerWindow = [[COSTouchVisualizerWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
		_touchVisualizerWindow.windowLevel = 100000000000;
		_touchVisualizerWindow.backgroundColor = [UIColor.greenColor colorWithAlphaComponent:0.0];
		_touchVisualizerWindow.hidden = NO;
		_touchVisualizerWindow.touchVisualizerWindowDelegate = self;
		_touchVisualizerWindow.userInteractionEnabled = NO;
	});
}

- (NSURL*)__dtx_URLOverride
{
	return [NSURL URLWithString:[[NSUserDefaults standardUserDefaults] objectForKey:@"detoxURLOverride"]];
}

- (NSString*)__dtx_sourceAppOverride
{
	return [[NSUserDefaults standardUserDefaults] objectForKey:@"detoxSourceAppOverride"];
}

- (NSDictionary*)__dtx_prepareLaunchOptions:(NSDictionary*)launchOptions userNotificationDispatcher:(DetoxUserNotificationDispatcher*)notificationDispatcher userActivityDispatcher:(DetoxUserActivityDispatcher*)activityDispatcher
{
	NSMutableDictionary* rv = [launchOptions mutableCopy] ?: [NSMutableDictionary new];
	
	if(notificationDispatcher)
	{
		rv[UIApplicationLaunchOptionsRemoteNotificationKey] = [notificationDispatcher remoteNotification];
	}
	
	if(activityDispatcher)
	{
		NSUserActivity* userActivity = [activityDispatcher userActivity];
		
		NSDictionary* userActivityDictionary = @{
												 @"UIApplicationLaunchOptionsUserActivityKey": userActivity,
												 UIApplicationLaunchOptionsUserActivityTypeKey: userActivity.activityType,
												 };
		
		rv[UIApplicationLaunchOptionsUserActivityDictionaryKey] = userActivityDictionary;
	}
	
	
	NSURL* openURLOverride = [self __dtx_URLOverride];
	if(openURLOverride)
	{
		rv[UIApplicationLaunchOptionsURLKey] = openURLOverride;
	}
	NSString* originalAppOverride = [self __dtx_sourceAppOverride];
	if(originalAppOverride)
	{
		rv[UIApplicationLaunchOptionsSourceApplicationKey] = originalAppOverride;
	}
	
	return rv;
}

- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id>*)launchOptions
{
	launchOptions = [self __dtx_prepareLaunchOptions:launchOptions userNotificationDispatcher:_pendingLaunchUserNotificationDispatcher userActivityDispatcher:_pendingLaunchUserActivityDispatcher];
	
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
	launchOptions = [self __dtx_prepareLaunchOptions:launchOptions userNotificationDispatcher:_pendingLaunchUserNotificationDispatcher userActivityDispatcher:_pendingLaunchUserActivityDispatcher];
	
	BOOL rv = YES;
	if([class_getSuperclass(object_getClass(self)) instancesRespondToSelector:_cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = class_getSuperclass(object_getClass(self))};
		BOOL (*super_class)(struct objc_super*, SEL, id, id) = (void*)objc_msgSendSuper;
		rv = super_class(&super, _cmd, application, launchOptions);
	}
	
	[_pendingLaunchUserNotificationDispatcher dispatchOnAppDelegate:self simulateDuringLaunch:YES];
	[_pendingLaunchUserActivityDispatcher dispatchOnAppDelegate:self];
	
	_pendingLaunchUserNotificationDispatcher = nil;
	_pendingLaunchUserActivityDispatcher = nil;
	
	if([self __dtx_URLOverride] && [class_getSuperclass(object_getClass(self)) instancesRespondToSelector:@selector(application:openURL:options:)])
	{
		[self application:application openURL:[self __dtx_URLOverride] options:launchOptions];
	}
	
	return rv;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
	if([class_getSuperclass(object_getClass(self)) instancesRespondToSelector:_cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = class_getSuperclass(object_getClass(self))};
		void (*super_class)(struct objc_super*, SEL, id) = (void*)objc_msgSendSuper;
		super_class(&super, _cmd, application);
	}
	
	dispatch_async(dispatch_get_main_queue(), ^{
		[_pendingOpenURLs enumerateObjectsUsingBlock:^(NSDictionary * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
			[self __dtx_actualDispatchOpenURL:obj];
		}];
		[_pendingOpenURLs removeAllObjects];
		
		[_pendingUserNotificationDispatchers enumerateObjectsUsingBlock:^(DetoxUserNotificationDispatcher * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
			[self __dtx_actualDispatchUserNotificationWithDispatcher:obj];
		}];
		[_pendingUserNotificationDispatchers removeAllObjects];
		
		[_pendingUserActivityDispatchers enumerateObjectsUsingBlock:^(DetoxUserActivityDispatcher * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
			[self __dtx_actualDispatchUserActivityWithDispatcher:obj];
		}];
		[_pendingUserActivityDispatchers removeAllObjects];
	});
}

- (BOOL)touchVisualizerWindowShouldAlwaysShowFingertip:(COSTouchVisualizerWindow *)window
{
	return YES;
}

- (void)__dtx_actualDispatchUserActivityWithDispatcher:(DetoxUserActivityDispatcher*)dispatcher
{
	[dispatcher dispatchOnAppDelegate:self];
}

- (void)__dtx_dispatchUserActivityFromDataURL:(NSURL*)userActivityDataURL delayUntilActive:(BOOL)delay
{
	DetoxUserActivityDispatcher* dispatcher = [[DetoxUserActivityDispatcher alloc] initWithUserActivityDataURL:userActivityDataURL];
	
	if(delay)
	{
		[_pendingUserActivityDispatchers addObject:dispatcher];
	}
	else
	{
		[self __dtx_actualDispatchUserActivityWithDispatcher:dispatcher];
	}
}

- (void)__dtx_actualDispatchUserNotificationWithDispatcher:(DetoxUserNotificationDispatcher*)dispatcher
{
	[dispatcher dispatchOnAppDelegate:self simulateDuringLaunch:NO];
}

- (void)__dtx_dispatchUserNotificationFromDataURL:(NSURL*)userNotificationDataURL delayUntilActive:(BOOL)delay
{
	DetoxUserNotificationDispatcher* dispatcher = [[DetoxUserNotificationDispatcher alloc] initWithUserNotificationDataURL:userNotificationDataURL];
	
	if(delay)
	{
		[_pendingUserNotificationDispatchers addObject:dispatcher];
	}
	else
	{
		[self __dtx_actualDispatchUserNotificationWithDispatcher:dispatcher];
	}
}

- (void)__dtx_actualDispatchOpenURL:(NSDictionary*)URLAndOptions
{
	if([self respondsToSelector:@selector(application:openURL:options:)])
	{
		[self application:[UIApplication sharedApplication] openURL:URLAndOptions[@"URL"] options:URLAndOptions[@"options"]];
	}
}

- (void)__dtx_dispatchOpenURL:(NSURL*)URL options:(NSDictionary*)options delayUntilActive:(BOOL)delay
{
	NSDictionary* payload = NSDictionaryOfVariableBindings(URL, options);
	
	if(delay)
	{
		[_pendingOpenURLs addObject:payload];
	}
	else
	{
		[self __dtx_actualDispatchOpenURL:payload];
	}
}

@end
