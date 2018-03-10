#import "AppDelegate.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>
#import <React/RCTPushNotificationManager.h>
#import <React/RCTLinkingManager.h>

@import UserNotifications;

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

@interface AppDelegate () <UNUserNotificationCenterDelegate>

@end

@implementation AppDelegate

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
	
	self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
	ShakeDetectViewController *rootViewController = [ShakeDetectViewController new];
	rootViewController.bridge = rootView.bridge;
	rootViewController.view = rootView;
	self.window.rootViewController = rootViewController;
	[self.window makeKeyAndVisible];
	
	[UNUserNotificationCenter currentNotificationCenter].delegate = self;
	
	return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
    return [RCTLinkingManager application:application openURL:url
                        sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]
                               annotation:options[UIApplicationOpenURLOptionsAnnotationKey]];
	return YES;
}

// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
	[RCTPushNotificationManager didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

// Required for the localNotification event.
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
	[RCTPushNotificationManager didReceiveLocalNotification:notification];
}

@end
