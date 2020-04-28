//
//  UIView+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/27/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+DetoxUtils.h"
#import "UIView+DetoxExpectations.h"

@implementation UIView (DetoxUtils)

- (void)dtx_assertVisible
{
	DTXAssert(self.dtx_isVisible == YES, @"View “%@” is not visible", self.dtx_shortDescription);
}

- (void)dtx_assertHittable
{
	DTXAssert(self.dtx_isHittable == YES, @"View “%@” is not hittable", self.dtx_shortDescription);
}

- (NSString *)dtx_shortDescription
{
	return [NSString stringWithFormat:@"<%@: %p>", self.class, self];
}

- (CGPoint)dtx_accessibilityActivationPoint
{
	CGPoint activationPoint = self.accessibilityActivationPoint;
	if(CGPointEqualToPoint(activationPoint, CGPointZero))
	{
		activationPoint = [self.coordinateSpace convertPoint:CGPointMake(CGRectGetMidX(self.bounds), CGRectGetMidY(self.bounds)) toCoordinateSpace:self.window.screen.coordinateSpace];
	}
	return activationPoint;
}

- (CGPoint)dtx_accessibilityActivationPointInViewCoordinateSpace
{
	return [self.window.screen.coordinateSpace convertPoint:self.dtx_accessibilityActivationPoint toCoordinateSpace:self.coordinateSpace];
}


@end
