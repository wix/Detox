#import "AppDelegate.h"
#import <React/RCTRootView.h>
#import <React/RCTPushNotificationManager.h>

@import UserNotifications;

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
	UIViewController *rootViewController = [UIViewController new];
	rootViewController.view = rootView;
	self.window.rootViewController = rootViewController;
	[self.window makeKeyAndVisible];
	
	[UNUserNotificationCenter currentNotificationCenter].delegate = self;
	
	return YES;
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
	NSLog(@"%@", url);
	
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
