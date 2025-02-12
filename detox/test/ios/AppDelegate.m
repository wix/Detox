#import "AppDelegate.h"

#import <CoreSpotlight/CoreSpotlight.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <UserNotifications/UserNotifications.h>
#import "example-Swift.h"

@interface AppDelegate () <UNUserNotificationCenterDelegate>
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    self.moduleName = @"example";
    self.initialProps = @{};

    BOOL result = [super application:application didFinishLaunchingWithOptions:launchOptions];

    [self setupNotifications];
    [self setupScreenManager];
    [self setupApplicationStateObservers];
    [UIViewController swizzleMotionEnded];

    return result;
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

#pragma mark - Setup Methods

- (void)setupNotifications {
    UNUserNotificationCenter.currentNotificationCenter.delegate = self;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleChangeScreen:)
                                                 name:@"ChangeScreen"
                                               object:nil];
}

- (void)setupScreenManager {
    self.screenManager = [[NativeScreenManager alloc] initWithWindow:self.window];
}

- (void)setupApplicationStateObservers {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationDidBecomeActive:)
                                                 name:UIApplicationDidBecomeActiveNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationWillResignActive:)
                                                 name:UIApplicationWillResignActiveNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationDidEnterBackground:)
                                                 name:UIApplicationDidEnterBackgroundNotification
                                               object:nil];
}

#pragma mark - Notification Handlers

- (void)handleChangeScreen:(NSNotification *)notification {
    [self.screenManager handle:notification];
}

- (void)applicationDidBecomeActive:(NSNotification *)notification {
    [self showOverlayMessageWithMessage:@"Active"];
}

- (void)applicationWillResignActive:(NSNotification *)notification {
    [self showOverlayMessageWithMessage:@"Inactive"];
}

- (void)applicationDidEnterBackground:(NSNotification *)notification {
    [self showOverlayMessageWithMessage:@"Background"];
}

#pragma mark - UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
    [self showOverlayMessageWithMessage:notification.request.content.title];

    completionHandler(UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner |
                      UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)(void))completionHandler {
    [self showOverlayMessageWithMessage:response.notification.request.content.title];

    completionHandler();
}

#pragma mark - Deep Linking

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
    return [RCTLinkingManager application:app openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
    if ([userActivity.activityType isEqualToString:CSSearchableItemActionType]) {
        NSString *identifier = userActivity.userInfo[CSSearchableItemActivityIdentifier];
        NSURL *url = identifier ? [NSURL URLWithString:identifier] : nil;

        if (url) {
            return [RCTLinkingManager application:application openURL:url options:@{
                UIApplicationOpenURLOptionsSourceApplicationKey: @"",
                UIApplicationOpenURLOptionsAnnotationKey: @{}
            }];
        }
        return NO;
    }

    return [RCTLinkingManager application:application continueUserActivity:userActivity
                       restorationHandler:restorationHandler];
}

#pragma mark - Overlay Message

- (void)showOverlayMessageWithMessage:(NSString *)message {
    // The Swift extension handles this method
}

@end
