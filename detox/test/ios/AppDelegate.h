#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>

#import "ReactNativeVersionExtracted.h"

#if REACT_NATIVE_VERSION_MAJOR == 0 && REACT_NATIVE_VERSION_MINOR < 79
#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif
#endif

@class ReactNativeDelegate;

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(AppDelegate)

#if REACT_NATIVE_VERSION_MAJOR == 0 && REACT_NATIVE_VERSION_MINOR < 79
@interface AppDelegate : RCTAppDelegate
#else
@interface AppDelegate : UIResponder <UIApplicationDelegate>
#endif

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) id screenManager;
@property (nonatomic, strong) ReactNativeDelegate *reactNativeDelegate;
@property (nonatomic, strong) RCTReactNativeFactory *reactNativeFactory;

- (void)showOverlayMessageWithMessage:(NSString *)message;

@end

NS_ASSUME_NONNULL_END
