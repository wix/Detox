#import <UIKit/UIKit.h>
#import <RCTAppDelegate.h>

@interface SomeMiddleman : UIWindow @end

@interface AnnoyingWindow : SomeMiddleman

@property (nonatomic, strong) UILabel* annoyingLabel;

@end

@interface DetoxApp : UIApplication @end

@interface AppDelegate : RCTAppDelegate <UIApplicationDelegate>

@property (nonatomic, strong) AnnoyingWindow *window;

@end
