#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import <React/RCTReactNativeDelegate.h>
#import <React/RCTReactNativeFactory.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(AppDelegate)
@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) id screenManager;
@property (nonatomic, strong) RCTReactNativeDelegate *reactNativeDelegate;
@property (nonatomic, strong) RCTReactNativeFactory *reactNativeFactory;

- (void)showOverlayMessageWithMessage:(NSString *)message;

@end

NS_ASSUME_NONNULL_END
