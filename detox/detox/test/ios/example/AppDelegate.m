#import "AppDelegate.h"
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <React/config/ReactNativeConfig.h>
#endif

#import "DragDropTableViewController.h"
#import "CustomKeyboardViewController.h"
@import CoreSpotlight;

@import UserNotifications;

#if EXTERNAL_LOGGER
extern void __dtx_send_external_log(const char* log) __attribute__((weak));
#define __dtx_external_logger(log) __dtx_send_external_log(log);
#else
#define __dtx_external_logger(log)
#endif

@implementation SomeMiddleman @end

@implementation AnnoyingWindow

- (instancetype)initWithFrame:(CGRect)frame
{
	self = [super initWithFrame:frame];
	
	if(self)
	{
		_annoyingLabel = [UILabel new];
		_annoyingLabel.translatesAutoresizingMaskIntoConstraints = NO;
		
		[self addSubview:_annoyingLabel];
		
		NSLayoutYAxisAnchor* topAnchor = self.safeAreaLayoutGuide.topAnchor;;
		NSLayoutConstraint* topConstraint = [_annoyingLabel.topAnchor constraintEqualToAnchor:topAnchor constant:-14];
		topConstraint.priority = UILayoutPriorityRequired - 1;
		[NSLayoutConstraint activateConstraints:@[
			[_annoyingLabel.centerXAnchor constraintEqualToAnchor:self.centerXAnchor],
			topConstraint,
			[_annoyingLabel.topAnchor constraintGreaterThanOrEqualToAnchor:self.topAnchor],
		]];
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

+ (BOOL)requiresMainQueueSetup
{
	return YES;
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

@implementation DetoxApp @end

#if RCT_NEW_ARCH_ENABLED
@interface AppDelegate () <UNUserNotificationCenterDelegate, RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
	RCTTurboModuleManager *_turboModuleManager;
	RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
	std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
	facebook::react::ContextContainer::Shared _contextContainer;
}
@end
#else
@interface AppDelegate () <UNUserNotificationCenterDelegate>

@end
#endif

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
	
	//RN 🤦‍♂️
	NSMutableDictionary* opts = launchOptions.mutableCopy;
	opts[UIApplicationLaunchOptionsRemoteNotificationKey] = nil;
	
	RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
														moduleName:@"example"
												 initialProperties:nil
													 launchOptions:opts];

#if RCT_NEW_ARCH_ENABLED
	_contextContainer = std::make_shared<facebook::react::ContextContainer const>();
	_reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
	_contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
	_bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
	rootView.bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
#endif

	rootView.backgroundColor = UIColor.whiteColor;
	
	self.window = [[AnnoyingWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
	self.window.isAccessibilityElement = YES;
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
	
	[NSNotificationCenter.defaultCenter addObserverForName:@"ChangeScreen" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
		NSString* name = note.userInfo[@"name"];
		
		if([name isEqualToString:@"dragAndDrop"])
		{
			DragDropTableViewController* vc = [[DragDropTableViewController alloc] initWithStyle:UITableViewStyleInsetGrouped];
			[self.window.rootViewController presentViewController:vc animated:YES completion:nil];
		} else if ([name isEqualToString:@"customKeyboard"])
		{
			CustomKeyboardViewController *vc = [[CustomKeyboardViewController alloc] init];
			vc.modalPresentationStyle = UIModalPresentationFullScreen;
			[self.window.rootViewController presentViewController:vc animated:YES completion:nil];
		}
	}];
	
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

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
	completionHandler(UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
	UILabel* someLabel = [UILabel new];
	someLabel.translatesAutoresizingMaskIntoConstraints = NO;
	
	someLabel.text = response.notification.request.content.title;
	someLabel.backgroundColor = UIColor.blackColor;
	someLabel.textColor = UIColor.whiteColor;
	someLabel.font = [UIFont systemFontOfSize:40];
	
	RCTRootView* rv = (id)self.window.rootViewController.view;
	//Add to the content view so that reloadReactNative() removes this label.
	[[rv valueForKey:@"contentView"] addSubview:someLabel];
	
	[NSLayoutConstraint activateConstraints:@[
		[someLabel.centerXAnchor constraintEqualToAnchor:self.window.centerXAnchor],
		[someLabel.topAnchor constraintEqualToAnchor:self.window.annoyingLabel.bottomAnchor],
	]];
	
	[someLabel.superview bringSubviewToFront:someLabel];
	
	static id __prevObserver = nil;
	
	//Cleanup the previous observer
	if(__prevObserver != nil)
	{
		[NSNotificationCenter.defaultCenter removeObserver:__prevObserver];
		__prevObserver = nil;
	}
	
	__prevObserver = [NSNotificationCenter.defaultCenter addObserverForName:RCTContentDidAppearNotification object:self.window.rootViewController.view queue:nil usingBlock:^(NSNotification * _Nonnull note) {
		if(someLabel.window == nil)
		{
			[NSNotificationCenter.defaultCenter removeObserver:__prevObserver];
			__prevObserver = nil;
			return;
		}
		
		[someLabel.superview bringSubviewToFront:someLabel];
	}];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void(^)(NSArray<id<UIUserActivityRestoring>> * __nullable restorableObjects))restorationHandler
{
	if([userActivity.activityType isEqualToString:CSSearchableItemActionType])
	{
		NSString* identifier = userActivity.userInfo[CSSearchableItemActivityIdentifier];
		
		//Fake it here as if it is a URL, but actually it's a searchable item identifier.
		return [RCTLinkingManager application:application
									  openURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@", identifier]]
							sourceApplication:@""
								   annotation:@{}];
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

#if RCT_NEW_ARCH_ENABLED

#pragma mark -
#pragma mark - RCTCxxBridgeDelegate
#pragma mark -

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge {
	_turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
															   delegate:self
															  jsInvoker:bridge.jsCallInvoker];
  return RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}

#pragma mark -
#pragma mark RCTTurboModuleManagerDelegate
#pragma mark -

- (Class)getModuleClassFromName:(const char *)name {
  return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
    jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker {
  return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
    initParams:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass {
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#endif

@end
