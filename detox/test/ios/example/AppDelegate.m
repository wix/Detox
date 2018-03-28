#import "AppDelegate.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>
#import <React/RCTPushNotificationManager.h>
#import <React/RCTLinkingManager.h>
@import CoreSpotlight;

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
{
	RCTRootView* _rootView;
}

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
	
	_rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
														moduleName:@"example"
												 initialProperties:nil
													 launchOptions:launchOptions];
	
	_rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
	self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
	ShakeDetectViewController *rootViewController = [ShakeDetectViewController new];
	rootViewController.bridge = _rootView.bridge;
	rootViewController.view = _rootView;
	self.window.rootViewController = rootViewController;
	[self.window makeKeyAndVisible];
	
	[UNUserNotificationCenter currentNotificationCenter].delegate = self;
	
	return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
    return [RCTLinkingManager application:application
								  openURL:url
								  options:options];
}

- (void)_fakeItWithAWebUserActivityForString:(NSString*)string
{
	NSUserActivity* fakeActivity = [[NSUserActivity alloc] initWithActivityType:NSUserActivityTypeBrowsingWeb];
	fakeActivity.webpageURL = [NSURL URLWithString:[NSString stringWithFormat:@"https://%@.detox.dtx", string]];
	
	void (^sendIt)(void) = ^ {
		[RCTLinkingManager application:UIApplication.sharedApplication continueUserActivity:fakeActivity restorationHandler:nil];
	};
	
	if(_rootView.bridge.isLoading)
	{
		//React Native is buggy
		__block __weak id observer;
		observer = [[NSNotificationCenter defaultCenter] addObserverForName:@"itFinallyRegistered" object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification * _Nonnull note) {
			sendIt();
			[[NSNotificationCenter defaultCenter] removeObserver:observer];
		}];
	}
	else
	{
		sendIt();
	}
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void(^)(void))completionHandler
{
	NSString* triggerClassName = NSStringFromClass(response.notification.request.trigger.class);
	NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"UN(.*)NotificationTrigger" options:0 error:NULL];
	NSArray* matches = [regex matchesInString:triggerClassName options:0 range:NSMakeRange(0, triggerClassName.length)];
	NSString* string = [[triggerClassName substringWithRange:[matches.firstObject rangeAtIndex:1]] lowercaseString];
	
	[self _fakeItWithAWebUserActivityForString:string];
	completionHandler();
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
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

@end
