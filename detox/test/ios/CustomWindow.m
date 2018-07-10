#import "CustomWindow.h"

@implementation CustomWindow

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
    UIView *hitTestResult = [super hitTest:point withEvent:event];
    
    if ([hitTestResult isKindOfClass:[UIWindow class]]) {
        return nil;
    }
    
    return hitTestResult;
}
@end
