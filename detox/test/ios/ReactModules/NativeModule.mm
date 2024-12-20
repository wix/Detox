#import "NativeModule.h"
#import <UIKit/UIKit.h>
#import <React/RCTRootView.h>

@interface NativeModule ()
@property (nonatomic, strong) UIWindow *overlayWindow;
@property (nonatomic, strong) UIView *overlayView;
@property (nonatomic, assign) NSInteger callCounter;
@end

@implementation NativeModule

RCT_EXPORT_MODULE();

#pragma mark - Lifecycle Methods

- (instancetype)init {
    self = [super init];
    if (self) {
        _callCounter = 0;
    }
    return self;
}

#pragma mark - Echo Methods

RCT_EXPORT_METHOD(echoWithoutResponse:(NSString *)str) {
    self.callCounter++;
}

RCT_EXPORT_METHOD(echoWithResponse:(NSString *)str
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.callCounter++;
    resolve(str);
}

#pragma mark - Timing Methods

RCT_EXPORT_METHOD(nativeSetTimeout:(NSTimeInterval)delay
                  block:(RCTResponseSenderBlock)block) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)),
                   dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self executeOnMainThread:^{
            block(@[]);
        }];
    });
}

#pragma mark - Navigation Methods

RCT_EXPORT_METHOD(switchToNativeRoot) {
    [self executeOnMainThread:^{
        UIViewController *newRoot = [self createNativeRootViewController];
        [self updateRootViewController:newRoot];
    }];
}

RCT_EXPORT_METHOD(switchToMultipleReactRoots) {
    [self executeOnMainThread:^{
        UITabBarController *tabController = [self createTabBarControllerWithBridge];
        [self updateRootViewController:tabController];
    }];
}

#pragma mark - Notification Methods

RCT_EXPORT_METHOD(sendNotification:(NSString*)notification
                  name:(NSString*)name) {
    [self executeOnMainThread:^{
        [NSNotificationCenter.defaultCenter postNotificationName:notification
                                                          object:nil
                                                        userInfo:@{@"name": name}];
    }];
}

#pragma mark - Overlay Methods

RCT_EXPORT_METHOD(presentOverlayWindow) {
    [self executeOnMainThread:^{
        [self setupAndShowOverlayWindow];
    }];
}

RCT_EXPORT_METHOD(presentOverlayView) {
    [self executeOnMainThread:^{
        [self setupAndShowOverlayView];
    }];
}

#pragma mark - Private Helper Methods

- (void)executeOnMainThread:(void (^)(void))block {
    if ([NSThread isMainThread]) {
        block();
    } else {
        dispatch_async(dispatch_get_main_queue(), block);
    }
}

- (UIViewController *)createNativeRootViewController {
    UIViewController *newRoot = [UIViewController new];
    newRoot.view.backgroundColor = UIColor.whiteColor;

    UILabel *label = [UILabel new];
    label.text = @"this is a new native root";
    [label sizeToFit];
    [newRoot.view addSubview:label];
    label.center = newRoot.view.center;

    return newRoot;
}

- (UITabBarController *)createTabBarControllerWithBridge {
    RCTBridge *bridge = [self getCurrentBridge];
    NSArray *viewControllers = @[
        [self createReactRootViewController:bridge title:@"1"],
        [self createReactRootViewController:bridge title:@"2"],
        [self createReactRootViewController:bridge title:@"3"],
        [self createReactRootViewController:bridge title:@"4"]
    ];

    UITabBarController *tabController = [UITabBarController new];
    tabController.viewControllers = viewControllers;
    return tabController;
}

- (UIViewController *)createReactRootViewController:(RCTBridge *)bridge
                                              title:(NSString *)title {
    UIViewController *viewController = [UIViewController new];
    viewController.view = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"example"
                                            initialProperties:nil];
    viewController.tabBarItem.title = title;
    return viewController;
}

- (RCTBridge *)getCurrentBridge {
    id<UIApplicationDelegate> delegate = UIApplication.sharedApplication.delegate;
    return ((RCTRootView *)delegate.window.rootViewController.view).bridge;
}

- (void)updateRootViewController:(UIViewController *)viewController {
    id<UIApplicationDelegate> delegate = UIApplication.sharedApplication.delegate;
    [delegate.window setRootViewController:viewController];
    [delegate.window makeKeyAndVisible];
}

- (void)setupAndShowOverlayWindow {
    CGRect screenBounds = UIScreen.mainScreen.bounds;
    self.overlayWindow = [[UIWindow alloc] initWithFrame:screenBounds];
    self.overlayWindow.accessibilityIdentifier = @"OverlayWindow";
    [self.overlayWindow setWindowLevel:UIWindowLevelStatusBar];
    [self.overlayWindow setHidden:NO];
    [self.overlayWindow makeKeyAndVisible];
}

- (void)setupAndShowOverlayView {
    CGRect screenBounds = UIScreen.mainScreen.bounds;
    self.overlayView = [[UIView alloc] initWithFrame:screenBounds];
    self.overlayView.userInteractionEnabled = YES;
    self.overlayView.accessibilityIdentifier = @"OverlayView";

    UIWindow *keyWindow = UIApplication.sharedApplication.keyWindow;
    [keyWindow addSubview:self.overlayView];
}

@end
