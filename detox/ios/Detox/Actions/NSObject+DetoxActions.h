//
//  NSObject+DetoxActions.h
//  Detox
//
//  Created by Leo Natan on 11/16/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSObject (DetoxActions)

- (void)dtx_tapAtAccessibilityActivationPoint;
- (void)dtx_tapAtAccessibilityActivationPointWithNumberOfTaps:(NSUInteger)numberOfTaps;
- (void)dtx_tapAtPoint:(CGPoint)point numberOfTaps:(NSUInteger)numberOfTaps NS_SWIFT_NAME(dtx_tap(atPoint:numberOfTaps:));
- (void)dtx_longPressAtAccessibilityActivationPoint;
- (void)dtx_longPressAtAccessibilityActivationPointForDuration:(NSTimeInterval)duration;
- (void)dtx_longPressAtPoint:(CGPoint)point duration:(NSTimeInterval)duration NS_SWIFT_NAME(dtx_longPress(atPoint:duration:));
- (void)dtx_swipeWithNormalizedOffset:(CGPoint)normalizedOffset velocity:(CGFloat)velocity;
- (void)dtx_pinchWithScale:(CGFloat)scale velocity:(CGFloat)velocity angle:(CGFloat)angle;

- (void)dtx_clearText;
- (void)dtx_typeText:(NSString*)text;
- (void)dtx_typeText:(NSString*)text atTextRange:(nullable UITextRange*)textRange;
- (void)dtx_replaceText:(NSString*)text;

@end

NS_ASSUME_NONNULL_END
