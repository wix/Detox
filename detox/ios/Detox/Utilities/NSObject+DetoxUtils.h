//
//  NSObject+DetoxUtils.h
//  Detox
//
//  Created by Leo Natan on 11/12/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

BOOL __DTXDoulbeEqualToDouble(double a, double b);
BOOL __DTXPointEqualToPoint(CGPoint a, CGPoint b);

inline __attribute__((__always_inline__))
static double LNLinearInterpolate(CGFloat from, CGFloat to, CGFloat p)
{
	return from + p * (to - from);
}

@interface NSObject (DetoxUtils)

@property (nonatomic, readonly, strong) NSString* accessibilityIdentifier;
@property (nonatomic, readonly, nullable) id accessibilityContainer;

@property (nonatomic, readonly) UIView* dtx_view;

- (CGPoint)dtx_convertRelativePointToViewCoordinateSpace:(CGPoint)relativePoint;

@property (nonatomic, readonly) CGRect dtx_bounds;
@property (nonatomic, readonly) CGRect dtx_contentBounds;
@property (nonatomic, readonly) CGRect dtx_visibleBounds;

- (BOOL)dtx_isVisible;
- (BOOL)dtx_isVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent
					  error:(NSError* __strong * __nullable)error;
- (void)dtx_assertVisible;
- (void)dtx_assertVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent;

- (BOOL)dtx_isFocused;

@property (nonatomic, readonly) BOOL dtx_isHittable;
- (BOOL)dtx_isHittableAtPoint:(CGPoint)point;
- (BOOL)dtx_isHittableAtPoint:(CGPoint)point error:(NSError* __strong * __nullable)error;
- (void)dtx_assertHittable;
- (void)dtx_assertHittableAtPoint:(CGPoint)point;

@property (nonatomic, copy, readonly) NSString* dtx_text;
@property (nonatomic, copy, readonly) NSString* dtx_placeholder;

@property (nonatomic, readonly) BOOL dtx_isEnabled;
- (void)dtx_assertEnabled;

@property (nonatomic, readonly, copy) NSString* dtx_shortDescription;
@property (nonatomic, readonly) CGRect dtx_accessibilityFrame;
@property (nonatomic, readonly) CGRect dtx_safeAreaBounds;
@property (nonatomic, readonly) CGPoint dtx_accessibilityActivationPoint;
@property (nonatomic, readonly) CGPoint dtx_accessibilityActivationPointInViewCoordinateSpace;

@property (nonatomic, readonly, class, copy) NSDictionary<NSString*, id>* dtx_genericElementDebugAttributes;
@property (nonatomic, readonly, copy) NSDictionary<NSString*, id>* dtx_attributes;
@property (nonatomic, readonly, copy) NSDictionary<NSString*, id>* dtx_elementDebugAttributes;

@end

NS_ASSUME_NONNULL_END
