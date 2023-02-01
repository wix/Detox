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

#import "DTXAddressInfo.h"

DTX_CREATE_LOG(AppDelegateProxy)
__unused static BOOL _enableVerboseLogging = NO;
#define dtx_log_verbose(format, ...) __extension__({ \
if(_enableVerboseLogging) { __dtx_log(__prepare_and_return_file_log(), OS_LOG_TYPE_DEBUG, __current_log_prefix, format, ##__VA_ARGS__); } \
})

#import <Detox/Detox-Swift.h>

@interface COSTouchVisualizerWindow () @end
@interface DTXTouchVisualizerWindow : COSTouchVisualizerWindow @end
@implementation DTXTouchVisualizerWindow

- (UIWindow *)overlayWindow
{
	return self;
}

- (BOOL)_canBecomeKeyWindow
{
	return NO;
}

@end

static NSObject<UIApplicationDelegate>* _userAppDelegate;
static DetoxAppDelegateProxy* _appDelegateProxy;

static NSMutableArray<NSDictionary*>* _pendingOpenURLs;
static NSMutableArray<DTXUserNotificationDispatcher*>* _pendingUserNotificationDispatchers;
static DTXUserNotificationDispatcher* _pendingLaunchUserNotificationDispatcher;
static NSMutableArray<DTXUserActivityDispatcher*>* _pendingUserActivityDispatchers;
static DTXUserActivityDispatcher* _pendingLaunchUserActivityDispatcher;

static DTXTouchVisualizerWindow* _touchVisualizerWindow;

static BOOL _disableTouchIndicator;

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
		DTXSwizzleMethod(self, @selector(sendEvent:), @selector(__dtx_sendEvent:), NULL);
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

+ (void)_regenerateNewAppDelegateProxy
{
	if(_appDelegateProxy != nil)
	{
		[NSNotificationCenter.defaultCenter removeObserver:_appDelegateProxy];
	}
	
	_appDelegateProxy = [DetoxAppDelegateProxy new];
	[NSNotificationCenter.defaultCenter addObserver:_appDelegateProxy selector:@selector(_applicationDidLaunchNotification:) name:UIApplicationDidFinishLaunchingNotification object:nil];
}

+ (instancetype)sharedAppDelegateProxy
{
	if(_appDelegateProxy == nil)
	{
		[self _regenerateNewAppDelegateProxy];
	}
	
	return _appDelegateProxy;
}

+ (void)load
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		_pendingOpenURLs = [NSMutableArray new];
		_pendingUserNotificationDispatchers = [NSMutableArray new];

		_disableTouchIndicator = [NSUserDefaults.standardUserDefaults boolForKey:@"detoxDisableTouchIndicators"];
		
		_enableVerboseLogging = [NSUserDefaults.standardUserDefaults boolForKey:@"enableAppDelegateVerboseLogging"];
		
		NSURL* url;
		
		_pendingUserActivityDispatchers = [NSMutableArray new];
		
		url = _launchUserActivityDataURL();
		if(url)
		{
			_pendingLaunchUserActivityDispatcher = [[DTXUserActivityDispatcher alloc] initWithUserActivityDataURL:url];
		}
		
		url = _launchUserNotificationDataURL();
		if(url)
		{
			_pendingLaunchUserNotificationDispatcher = [[DTXUserNotificationDispatcher alloc] initWithUserNotificationDataURL:url];
		}
		
		Method m = class_getInstanceMethod([UIApplication class], @selector(delegate));
		__unused id<UIApplicationDelegate> (*origDelegate)(id, SEL) = (void*)method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^(id _self) {
			NSArray* zz = [NSThread callStackReturnAddresses];
			NSUInteger caller = [zz[1] unsignedIntegerValue];
			DTXAddressInfo* ainfo = [[DTXAddressInfo alloc] initWithAddress:caller];
			NSString* image = ainfo.image;
			
			NSMutableString* request = [NSMutableString stringWithFormat:@"Delegate request from “%@`%@”; ", ainfo.image, ainfo.symbol];
			dtx_defer {
				dtx_log_verbose(@"%@", request);
			};
			
			if([image isEqualToString:@"UIKit"] || [image isEqualToString:@"UIKitCore"])
			{
				[request appendString:@"providing proxy app delegate to caller"];
				return (id<UIApplicationDelegate>)DetoxAppDelegateProxy.sharedAppDelegateProxy;
			}
			
			[request appendString:@"providing user app delegate to caller"];
			return (id<UIApplicationDelegate>)_userAppDelegate;
		}));
		
		m = class_getInstanceMethod([UIApplication class], @selector(setDelegate:));
		void (*origSetDelegate)(id, SEL, NSObject<UIApplicationDelegate, COSTouchVisualizerWindowDelegate>*) = (void*)method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^ (id _self, NSObject<UIApplicationDelegate, COSTouchVisualizerWindowDelegate>* origDelegate) {
			_userAppDelegate = origDelegate;
			origSetDelegate(_self, @selector(setDelegate:), DetoxAppDelegateProxy.sharedAppDelegateProxy);
		}));
	});
}

- (void)_applicationDidLaunchNotification:(NSNotification*)notification
{
	if(!_disableTouchIndicator)
	{
		dispatch_async(dispatch_get_main_queue(), ^{
			_touchVisualizerWindow = [[DTXTouchVisualizerWindow alloc] initWithFrame:CGRectZero];
			_touchVisualizerWindow.windowLevel = 100000000000;
			_touchVisualizerWindow.backgroundColor = [UIColor.greenColor colorWithAlphaComponent:0.0];
			_touchVisualizerWindow.hidden = NO;
			_touchVisualizerWindow.touchVisualizerWindowDelegate = self;
			_touchVisualizerWindow.stationaryMorphEnabled = NO;
			_touchVisualizerWindow.userInteractionEnabled = NO;
			_touchVisualizerWindow.frame = UIScreen.mainScreen.bounds;
			
//			UIVisualEffectView* blurView = [[UIVisualEffectView alloc] initWithEffect:[UIBlurEffect effectWithStyle:UIBlurEffectStyleExtraLight]];
//			blurView.translatesAutoresizingMaskIntoConstraints = NO;
//			
//			[_touchVisualizerWindow addSubview:blurView];
//			
//			[NSLayoutConstraint activateConstraints:@[
//				[_touchVisualizerWindow.leadingAnchor constraintEqualToAnchor:blurView.leadingAnchor],
//				[_touchVisualizerWindow.rightAnchor constraintEqualToAnchor:blurView.rightAnchor],
//				[_touchVisualizerWindow.topAnchor constraintEqualToAnchor:blurView.topAnchor],
//				[_touchVisualizerWindow.bottomAnchor constraintEqualToAnchor:blurView.bottomAnchor],
//			]];
		});
	}
}

- (NSURL*)_URLOverride
{
	return [NSURL URLWithString:[[NSUserDefaults standardUserDefaults] objectForKey:@"detoxURLOverride"]];
}

- (NSString*)_sourceAppOverride
{
	return [[NSUserDefaults standardUserDefaults] objectForKey:@"detoxSourceAppOverride"];
}

- (NSDictionary*)_prepareLaunchOptions:(NSDictionary*)launchOptions userNotificationDispatcher:(DTXUserNotificationDispatcher*)notificationDispatcher userActivityDispatcher:(DTXUserActivityDispatcher*)activityDispatcher
{
	NSMutableDictionary* rv = [launchOptions mutableCopy] ?: [NSMutableDictionary new];
	
	if(notificationDispatcher && notificationDispatcher.remoteNotificationDictionary)
	{
		rv[UIApplicationLaunchOptionsRemoteNotificationKey] = notificationDispatcher.remoteNotificationDictionary;
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
	
	return rv;
}

- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id>*)launchOptions
{
	launchOptions = [self _prepareLaunchOptions:launchOptions userNotificationDispatcher:_pendingLaunchUserNotificationDispatcher userActivityDispatcher:_pendingLaunchUserActivityDispatcher];
	
	BOOL rv = YES;
	if([_userAppDelegate respondsToSelector:_cmd])
	{
		rv = [_userAppDelegate application:application willFinishLaunchingWithOptions:launchOptions];
	}
	
	return rv;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id> *)launchOptions
{
	launchOptions = [self _prepareLaunchOptions:launchOptions userNotificationDispatcher:_pendingLaunchUserNotificationDispatcher userActivityDispatcher:_pendingLaunchUserActivityDispatcher];
	
	BOOL rv = YES;
	if([_userAppDelegate respondsToSelector:_cmd])
	{
		rv = [_userAppDelegate application:application didFinishLaunchingWithOptions:launchOptions];
	}
	
	[_pendingLaunchUserNotificationDispatcher dispatchOnAppDelegate:self simulateDuringLaunch:YES];
	[_pendingLaunchUserActivityDispatcher dispatchOnAppDelegate:self];
	
	_pendingLaunchUserNotificationDispatcher = nil;
	_pendingLaunchUserActivityDispatcher = nil;
	
	if([self _URLOverride] && [class_getSuperclass(object_getClass(self)) instancesRespondToSelector:@selector(application:openURL:options:)])
	{
		[self application:application openURL:[self _URLOverride] options:launchOptions];
	}
	
	return rv;
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
	if([_userAppDelegate respondsToSelector:_cmd])
	{
		[_userAppDelegate applicationDidBecomeActive:application];
	}
	
	[_pendingOpenURLs enumerateObjectsUsingBlock:^(NSDictionary * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		[self _actualDispatchOpenURL:obj];
	}];
	[_pendingOpenURLs removeAllObjects];
	
	[_pendingUserNotificationDispatchers enumerateObjectsUsingBlock:^(DTXUserNotificationDispatcher * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		[self _actualDispatchUserNotificationWithDispatcher:obj];
	}];
	[_pendingUserNotificationDispatchers removeAllObjects];
	
	[_pendingUserActivityDispatchers enumerateObjectsUsingBlock:^(DTXUserActivityDispatcher * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		[self _actualDispatchUserActivityWithDispatcher:obj];
	}];
	[_pendingUserActivityDispatchers removeAllObjects];
}

- (BOOL)touchVisualizerWindowShouldAlwaysShowFingertip:(COSTouchVisualizerWindow *)window
{
	return _disableTouchIndicator == NO;
}

- (void)_actualDispatchUserActivityWithDispatcher:(DTXUserActivityDispatcher*)dispatcher
{
	[dispatcher dispatchOnAppDelegate:self];
}

- (void)_dispatchUserActivityFromDataURL:(NSURL*)userActivityDataURL delayUntilActive:(BOOL)delay
{
	DTXUserActivityDispatcher* dispatcher = [[DTXUserActivityDispatcher alloc] initWithUserActivityDataURL:userActivityDataURL];
	
	if(delay)
	{
		[_pendingUserActivityDispatchers addObject:dispatcher];
	}
	else
	{
		[self _actualDispatchUserActivityWithDispatcher:dispatcher];
	}
}

- (void)_actualDispatchUserNotificationWithDispatcher:(DTXUserNotificationDispatcher*)dispatcher
{
	[dispatcher dispatchOnAppDelegate:self simulateDuringLaunch:NO];
}

- (void)_dispatchUserNotificationFromDataURL:(NSURL*)userNotificationDataURL delayUntilActive:(BOOL)delay
{
	DTXUserNotificationDispatcher* dispatcher = [[DTXUserNotificationDispatcher alloc] initWithUserNotificationDataURL:userNotificationDataURL];
	
	if(delay && UIApplication.sharedApplication.applicationState != UIApplicationStateActive)
	{
		[_pendingUserNotificationDispatchers addObject:dispatcher];
	}
	else
	{
		[self _actualDispatchUserNotificationWithDispatcher:dispatcher];
	}
}

- (void)_actualDispatchOpenURL:(NSDictionary*)URLAndOptions
{
	if([self respondsToSelector:@selector(application:openURL:options:)])
	{
		[self application:[UIApplication sharedApplication] openURL:URLAndOptions[@"URL"] options:URLAndOptions[@"options"]];
	}
}

- (void)_dispatchOpenURL:(NSURL*)URL options:(NSDictionary*)options delayUntilActive:(BOOL)delay
{
	NSDictionary* payload = NSDictionaryOfVariableBindings(URL, options);
	
	if(delay)
	{
		[_pendingOpenURLs addObject:payload];
	}
	else
	{
		[self _actualDispatchOpenURL:payload];
	}
}

#pragma mark Proxy

#define BOOLTOSTR(b) (b == YES ? @"YES" : @"NO")

- (BOOL)respondsToSelector:(SEL)aSelector
{
	BOOL proxy = [super respondsToSelector:aSelector];
	BOOL user = [_userAppDelegate respondsToSelector:aSelector];
	BOOL responds = proxy || user;
	dtx_log_verbose(@"Selector “%@” %@", NSStringFromSelector(aSelector), responds ? [NSString stringWithFormat:@"known (proxy:%@, user:%@)", BOOLTOSTR(proxy), BOOLTOSTR(user)] : @"unknown");
	
	return responds;
}

- (id)forwardingTargetForSelector:(SEL)aSelector
{
	if([super respondsToSelector:aSelector])
	{
		return self;
	}
	
	dtx_log_verbose(@"Forwarding selector “%@” to original app delegate", NSStringFromSelector(aSelector));
	return _userAppDelegate;
}

@end
