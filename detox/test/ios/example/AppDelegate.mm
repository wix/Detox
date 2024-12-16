#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <UserNotifications/UserNotifications.h>
#import <CoreSpotlight/CoreSpotlight.h>

// Shake event handling
@interface ShakeEventEmitter : RCTEventEmitter
@end

static ShakeEventEmitter* _shakeInstance;

@implementation ShakeEventEmitter
RCT_EXPORT_MODULE();

- (instancetype)init {
    self = [super init];
    _shakeInstance = self;
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"ShakeEvent"];
}

- (void)sendShakeEvent {
    [self sendEventWithName:@"ShakeEvent" body:nil];
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}
@end

// Custom ViewController for shake detection
@interface ShakeDetectViewController : UIViewController
@property (nonatomic, weak) RCTBridge* bridge;
@end

@implementation ShakeDetectViewController
- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    if(event.subtype == UIEventSubtypeMotionShake) {
        [_shakeInstance sendShakeEvent];
    }
}
@end

@interface AppDelegate () <UNUserNotificationCenterDelegate>
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    self.moduleName = @"example";
    self.initialProps = @{};

    // Setup notification delegate
    [UNUserNotificationCenter currentNotificationCenter].delegate = self;

    return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// URL scheme handling
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
    return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal links and Spotlight search handling
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void(^)(NSArray<id<UIUserActivityRestoring>> *))restorationHandler
{
    return [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

// Push notification handling
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
    completionHandler(UNNotificationPresentationOptionList |
                      UNNotificationPresentationOptionBanner |
                      UNNotificationPresentationOptionBadge |
                      UNNotificationPresentationOptionSound);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
    completionHandler();
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
    return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
