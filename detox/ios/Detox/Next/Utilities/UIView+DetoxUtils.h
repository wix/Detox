//
//  UIView+DetoxUtils.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/27/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

BOOL __DTXDoulbeEqualToDouble(double a, double b);
BOOL __DTXPointEqualToPoint(CGPoint a, CGPoint b);

inline __attribute__((__always_inline__))
static double LNLinearInterpolate(CGFloat from, CGFloat to, CGFloat p)
{
	return from + p * (to - from);
}

@interface UIView (DetoxUtils)

@property (nonatomic, readonly) BOOL dtx_isVisible;
@property (nonatomic, readonly) BOOL dtx_isHittable;

- (BOOL)dtx_isVisibleAtPoint:(CGPoint)point;
- (BOOL)dtx_isVisibleAtPoint:(CGPoint)point error:(NSError* __strong * __nullable)error;
- (BOOL)dtx_isHittableAtPoint:(CGPoint)point;
- (BOOL)dtx_isHittableAtPoint:(CGPoint)point error:(NSError* __strong * __nullable)error;

- (void)dtx_assertVisible;
- (void)dtx_assertHittable;
- (void)dtx_assertVisibleAtPoint:(CGPoint)point;
- (void)dtx_assertHittableAtPoint:(CGPoint)point;

@property (nonatomic, readonly, copy) NSString* dtx_shortDescription;
@property (nonatomic, readonly) CGRect dtx_accessibilityFrame;
@property (nonatomic, readonly) CGRect dtx_safeAreaBounds;
@property (nonatomic, readonly) CGPoint dtx_accessibilityActivationPoint;
@property (nonatomic, readonly) CGPoint dtx_accessibilityActivationPointInViewCoordinateSpace;

- (UIImage*)dtx_imageAroundPoint:(CGPoint)point;

@property (nonatomic, readonly, copy) NSDictionary<NSString*, id>* dtx_attributes;
@property (nonatomic, readonly, copy) NSDictionary<NSString*, id>* dtx_viewDebugAttributes;

@property (nonatomic, readonly, weak) UIViewController* dtx_containingViewController;

@end

NS_ASSUME_NONNULL_END
