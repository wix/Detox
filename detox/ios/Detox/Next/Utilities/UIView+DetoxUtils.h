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
- (NSString*)dtx_shortDescription;
- (CGPoint)dtx_accessibilityActivationPoint;
- (CGPoint)dtx_accessibilityActivationPointInViewCoordinateSpace;

@end

NS_ASSUME_NONNULL_END
