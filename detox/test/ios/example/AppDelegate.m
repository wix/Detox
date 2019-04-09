#import "AppDelegate.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>
#import <React/RCTPushNotificationManager.h>
#import <React/RCTLinkingManager.h>
@import CoreSpotlight;

@import UserNotifications;

#if EXTERNAL_LOGGER
extern void __dtx_send_external_log(const char* log) __attribute__((weak));
#define __dtx_external_logger(log) __dtx_send_external_log(log);
#else
#define __dtx_external_logger(log)
#endif

@implementation AnnoyingWindow

- (instancetype)initWithFrame:(CGRect)frame
{
	self = [super initWithFrame:frame];
	
	if(self)
	{
		_annoyingLabel = [UILabel new];
		
		[self addSubview:_annoyingLabel];
	}
	
	return self;
}

- (void)setHidden:(BOOL)hidden
{
	[super setHidden:hidden];
}

- (void)layoutSubviews
{
	[super layoutSubviews];
	
	[self bringSubviewToFront:_annoyingLabel];
	
	UIEdgeInsets insets;
	if (@available(iOS 11.0, *)) {
		insets = self.safeAreaInsets;
	}
	
	_annoyingLabel.center = CGPointMake(self.center.x, insets.top);
}

@end

@interface ShakeEventEmitter : RCTEventEmitter @end
static ShakeEventEmitter* _instance;
@implementation ShakeEventEmitter

RCT_EXPORT_MODULE();

- (instancetype)init
{
	self = [super init];
	_instance = self;
	return self;
}

- (NSArray<NSString *> *)supportedEvents
{
	return @[@"ShakeEvent"];
}

- (void)sendShakeEvent
{
	[self sendEventWithName:@"ShakeEvent" body:nil];
}

@end

@interface ShakeDetectViewController : UIViewController
@property (nonatomic, weak) RCTBridge* bridge;
@end
@implementation ShakeDetectViewController

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	if(event.subtype == UIEventSubtypeMotionShake)
	{
		[_instance sendShakeEvent];
	}
	else
	{
		//This will disable RN dev menu even in debug as shake events are not passed further in responder chain.
		[super motionEnded:motion withEvent:event];
	}
}

@end

@implementation DetoxApp

- (UIWindow *)keyWindow
{
	UIWindow* rv = super.keyWindow;
	
	if(rv == nil)
	{
		rv = self.delegate.window;
	}
	
	return rv;
}

@end

@interface AppDelegate () <UNUserNotificationCenterDelegate>

@end

@implementation AppDelegate
{
	UILabel* _resignActive;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
	// this conditional init loads Detox only when command line arguments are given
	// in normal execution, Detox is not loaded and there's zero impact on the app
	
	NSURL *jsCodeLocation;
	
	// this is a simple variant over the default React Native starter project which loads the bundle
	// in Debug from the packager (OPTION 1) and in Release from a local resource (OPTION 2)
#ifdef DEBUG
	jsCodeLocation = [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle?platform=ios&dev=true"];
#else
	jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
	
	RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
														moduleName:@"example"
												 initialProperties:nil
													 launchOptions:launchOptions];
	rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
	
	self.window = [[AnnoyingWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
	ShakeDetectViewController *rootViewController = [ShakeDetectViewController new];
	rootViewController.bridge = rootView.bridge;
	rootViewController.view = rootView;
	self.window.rootViewController = rootViewController;
	[self.window makeKeyAndVisible];
	
	[UNUserNotificationCenter currentNotificationCenter].delegate = self;
	
	self.window.annoyingLabel.text = @"App is inactive";
	self.window.annoyingLabel.backgroundColor = UIColor.redColor;
	self.window.annoyingLabel.textColor = UIColor.whiteColor;
	self.window.annoyingLabel.font = [UIFont systemFontOfSize:30];
	[self.window.annoyingLabel sizeToFit];
	
	return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
	__dtx_external_logger("Got openURL:");
	
    BOOL rv = [RCTLinkingManager application:application
								  openURL:url
                        sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]
                               annotation:options[UIApplicationOpenURLOptionsAnnotationKey]];
	
	__dtx_external_logger("Finished openURL:");
	
	return rv;
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
	[RCTPushNotificationManager didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
	[RCTPushNotificationManager didReceiveLocalNotification:notification];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(id)restorationHandler
{
	if([userActivity.activityType isEqualToString:CSSearchableItemActionType])
	{
		NSString* identifier = userActivity.userInfo[CSSearchableItemActivityIdentifier];
		
		//Fake it here as if it is a URL, but actually it's a searchable item identifier.
		return [RCTLinkingManager application:application
									  openURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@", identifier]]
							sourceApplication:nil
								   annotation:nil];
	}
	
	return [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

- (NSString*)_stringFromAppState
{
	switch (UIApplication.sharedApplication.applicationState) {
		case UIApplicationStateActive:
			return @"Active";
		case UIApplicationStateInactive:
			return @"Inactive";
		case UIApplicationStateBackground:
			return @"Background";
	}
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
	self.window.annoyingLabel.text = [self _stringFromAppState];
	self.window.annoyingLabel.backgroundColor = UIColor.redColor;
	[self.window.annoyingLabel sizeToFit];
	
	__dtx_external_logger("DidEnterBackground");
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
	self.window.annoyingLabel.text = [self _stringFromAppState];
	self.window.annoyingLabel.backgroundColor = UIColor.redColor;
	[self.window.annoyingLabel sizeToFit];
	
	__dtx_external_logger("WillEnterForeground");
}

- (void)applicationWillResignActive:(UIApplication *)application
{
	self.window.annoyingLabel.text = [self _stringFromAppState];
	self.window.annoyingLabel.backgroundColor = UIColor.redColor;
	[self.window.annoyingLabel sizeToFit];
	
	__dtx_external_logger("WillResignActive");
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
	self.window.annoyingLabel.text = [self _stringFromAppState];
	self.window.annoyingLabel.backgroundColor = UIColor.greenColor;
	[self.window.annoyingLabel sizeToFit];
	
	__dtx_external_logger("DidBecomeActive");
}

@end
