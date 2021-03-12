#import <UIKit/UIKit.h>

@interface AnnoyingWindow : UIWindow

@property (nonatomic, strong) UILabel* annoyingLabel;

@end

@interface DetoxApp : UIApplication @end

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) AnnoyingWindow *window;

@end
