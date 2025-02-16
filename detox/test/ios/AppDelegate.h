#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(AppDelegate)
@interface AppDelegate : RCTAppDelegate

@property (nonatomic, strong) id screenManager;

- (void)showOverlayMessageWithMessage:(NSString *)message;

@end

NS_ASSUME_NONNULL_END
