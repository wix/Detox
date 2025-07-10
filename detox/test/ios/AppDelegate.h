#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>

@class ReactNativeDelegate;

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(AppDelegate)
@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) id screenManager;
@property (nonatomic, strong) ReactNativeDelegate *reactNativeDelegate;
@property (nonatomic, strong) RCTReactNativeFactory *reactNativeFactory;

- (void)showOverlayMessageWithMessage:(NSString *)message;

@end

NS_ASSUME_NONNULL_END
