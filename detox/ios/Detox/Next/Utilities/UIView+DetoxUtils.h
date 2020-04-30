//
//  UIView+DetoxUtils.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/27/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIView (DetoxUtils)

- (void)dtx_assertVisible;
- (void)dtx_assertHittable;
- (void)dtx_assertVisibleAtPoint:(CGPoint)point;
- (void)dtx_assertHittableAtPoint:(CGPoint)point;

@property (nonatomic, readonly, copy) NSString* dtx_shortDescription;
@property (nonatomic, readonly) CGRect dtx_safeAreaBounds;
@property (nonatomic, readonly) CGPoint dtx_accessibilityActivationPoint;
@property (nonatomic, readonly) CGPoint dtx_accessibilityActivationPointInViewCoordinateSpace;

@end

NS_ASSUME_NONNULL_END
