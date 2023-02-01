#import <UIKit/UIKit.h>

@interface SomeMiddleman : UIWindow @end

@interface AnnoyingWindow : SomeMiddleman

@property (nonatomic, strong) UILabel* annoyingLabel;

@end

@interface DetoxApp : UIApplication @end

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) AnnoyingWindow *window;

@end
