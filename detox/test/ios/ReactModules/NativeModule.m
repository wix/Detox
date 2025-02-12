//
//  NativeModule.m (example)
//  Created by Asaf Korem (Wix.com) on 2025.
//

#import "NativeModule.h"
#import <React/RCTRootView.h>
#import <React/RCTBridge.h>

@implementation NativeModule

RCT_EXPORT_MODULE();

- (instancetype)init {
    if (self = [super init]) {
        self.callCounter = 0;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

// MARK: - Locale Methods
RCT_EXPORT_METHOD(getUserLocale:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLocale *currentLocale = [NSLocale currentLocale];
    NSString *localeIdentifier = [currentLocale localeIdentifier];
    resolve(localeIdentifier);
}

RCT_EXPORT_METHOD(getUserLanguage:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *languageCode = [[NSLocale preferredLanguages] firstObject];
    if (languageCode) {
        resolve(languageCode);
    } else {
        NSError *error = [NSError errorWithDomain:@"NativeModule"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: @"Could not determine user language"}];
        reject(@"no_language", @"Could not determine user language", error);
    }
}

// MARK: - Echo Methods
RCT_EXPORT_METHOD(echoWithoutResponse:(NSString *)str) {
    self.callCounter++;
}

RCT_EXPORT_METHOD(echoWithResponse:(NSString *)str 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.callCounter++;
    resolve(str);
}

// MARK: - Timing Methods
RCT_EXPORT_METHOD(nativeSetTimeout:(NSTimeInterval)delay 
                  block:(RCTResponseSenderBlock)block) {
    dispatch_time_t dispatchTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC));
    dispatch_after(dispatchTime, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        dispatch_async(dispatch_get_main_queue(), ^{
            block(@[]);
        });
    });
}

// MARK: - Navigation Methods
RCT_EXPORT_METHOD(switchToNativeRoot) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *newRoot = [self createNativeRootViewController];
        [self updateRootViewController:newRoot];
    });
}

RCT_EXPORT_METHOD(switchToMultipleReactRoots) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UITabBarController *tabController = [self createTabBarControllerWithBridge];
        [self updateRootViewController:tabController];
    });
}

// MARK: - Notification Methods
RCT_EXPORT_METHOD(sendNotification:(NSString *)notification 
                  name:(NSString *)name) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [[NSNotificationCenter defaultCenter] postNotificationName:notification
                                                          object:nil
                                                        userInfo:@{@"name": name}];
    });
}

// MARK: - Overlay Methods
RCT_EXPORT_METHOD(presentOverlayWindow) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self setupAndShowOverlayWindow];
    });
}

RCT_EXPORT_METHOD(presentOverlayView) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self setupAndShowOverlayView];
    });
}

// MARK: - Private Helper Methods
- (UIViewController *)createNativeRootViewController {
    UIViewController *newRoot = [[UIViewController alloc] init];
    newRoot.view.backgroundColor = [UIColor whiteColor];
    
    UILabel *label = [[UILabel alloc] init];
    label.text = @"this is a new native root";
    [label sizeToFit];
    label.center = newRoot.view.center;
    [newRoot.view addSubview:label];
    
    return newRoot;
}

- (UITabBarController *)createTabBarControllerWithBridge {
    RCTBridge *bridge = [self getCurrentBridge];
    if (!bridge) {
        return nil;
    }
    
    NSMutableArray *viewControllers = [NSMutableArray array];
    for (NSInteger i = 1; i <= 4; i++) {
        UIViewController *vc = [self createReactRootViewControllerWithBridge:bridge 
                                                                     title:[NSString stringWithFormat:@"%ld", (long)i]];
        [viewControllers addObject:vc];
    }
    
    UITabBarController *tabController = [[UITabBarController alloc] init];
    tabController.viewControllers = viewControllers;
    return tabController;
}

- (UIViewController *)createReactRootViewControllerWithBridge:(RCTBridge *)bridge title:(NSString *)title {
    UIViewController *viewController = [[UIViewController alloc] init];
    viewController.view = [[RCTRootView alloc] initWithBridge:bridge
                                                  moduleName:@"example"
                                           initialProperties:nil];
    viewController.tabBarItem.title = title;
    return viewController;
}

- (RCTBridge *)getCurrentBridge {
    id appDelegate = [[UIApplication sharedApplication] delegate];
    if ([appDelegate respondsToSelector:@selector(window)]) {
        UIWindow *window = [appDelegate window];
        RCTRootView *rootView = (RCTRootView *)window.rootViewController.view;
        if ([rootView isKindOfClass:[RCTRootView class]]) {
            return rootView.bridge;
        }
    }
    return nil;
}

- (void)updateRootViewController:(UIViewController *)viewController {
    id appDelegate = [[UIApplication sharedApplication] delegate];
    if ([appDelegate respondsToSelector:@selector(window)]) {
        UIWindow *window = [appDelegate window];
        window.rootViewController = viewController;
        [window makeKeyAndVisible];
    }
}

- (void)setupAndShowOverlayWindow {
    CGRect screenBounds = [[UIScreen mainScreen] bounds];
    self.overlayWindow = [[UIWindow alloc] initWithFrame:screenBounds];
    self.overlayWindow.accessibilityIdentifier = @"OverlayWindow";
    self.overlayWindow.windowLevel = UIWindowLevelStatusBar;
    self.overlayWindow.hidden = NO;
    [self.overlayWindow makeKeyAndVisible];
}

- (void)setupAndShowOverlayView {
    UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
    if (!keyWindow) return;
    
    CGRect screenBounds = [[UIScreen mainScreen] bounds];
    self.overlayView = [[UIView alloc] initWithFrame:screenBounds];
    self.overlayView.userInteractionEnabled = YES;
    self.overlayView.accessibilityIdentifier = @"OverlayView";
    [keyWindow addSubview:self.overlayView];
}

@end
