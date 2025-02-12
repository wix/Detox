#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface NativeScreenManager : NSObject

- (instancetype)initWithWindow:(nullable UIWindow *)window;
- (void)handle:(NSNotification *)notification;

@end

NS_ASSUME_NONNULL_END
