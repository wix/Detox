//
//  UIView+Detox.h
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIView (Detox)

- (void)dtx_tapAtAccessibilityActivationPoint;
- (void)dtx_tapAtPoint:(CGPoint)point numberOfTaps:(NSUInteger)numberOfTaps;
- (void)dtx_longPressAtAccessibilityActivationPoint;
- (void)dtx_longPressAtAccessibilityActivationPointForDuration:(NSTimeInterval)duration;
- (void)dtx_longPressAtPoint:(CGPoint)point duration:(NSTimeInterval)duration;

@end

NS_ASSUME_NONNULL_END
