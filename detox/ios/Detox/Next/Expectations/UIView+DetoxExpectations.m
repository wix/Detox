//
//  UIView+DetoxExpectations.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/19/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+DetoxUtils.h"
#import "UIView+DetoxExpectations.h"
#import "DTXAppleInternals.h"

@import ObjectiveC;

@implementation UIView (DetoxExpectations)

- (UIView*)dtx_visTest:(CGPoint)point withEvent:(UIEvent *)event;
{
	CGPoint localPoint = [self.window.screen.coordinateSpace convertPoint:point toCoordinateSpace:self.coordinateSpace];
	if([self pointInside:localPoint withEvent:event] == NO)
	{
		return nil;
	}
	
	if(self.isHiddenOrHasHiddenAncestor == YES)
	{
		return nil;
	}
	
	__block UIView* rv;
	
	//Front-most views get priority
	[self.subviews enumerateObjectsWithOptions:NSEnumerationReverse usingBlock:^(__kindof UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		rv = [obj dtx_visTest:point withEvent:event];
		
		if(rv != nil)
		{
			*stop = YES;
		}
	}];
	
	if(rv == nil)
	{
		rv = self;
	}
	
	return rv;
}

- (BOOL)dtx_isVisible
{
	return [self dtx_isVisibleAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace];
}

- (BOOL)dtx_isHittable
{
	return [self dtx_isHittableAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace];
}

- (BOOL)dtx_isVisibleAtPoint:(CGPoint)point
{
	return [self _dtx_someTestAtPoint:point testSelector:@selector(dtx_visTest:withEvent:)];
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point
{
	return [self _dtx_someTestAtPoint:point testSelector:@selector(hitTest:withEvent:)];
}

- (BOOL)_dtx_someTestAtPoint:(CGPoint)point testSelector:(SEL)selector
{
	//Point in window coordinate space
	CGPoint activationPoint = [self.window convertPoint:point fromView:self];
	
	if(CGRectContainsPoint(self.window.bounds, activationPoint) == NO)
	{
		return NO;
	}
	
	if(CGRectGetWidth(self.dtx_safeAreaBounds) == 0 || CGRectGetHeight(self.dtx_safeAreaBounds) == 0)
	{
		return NO;
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		return NO;
	}
	
	id (*testFunc)(id, SEL, CGPoint, id) = (void*)objc_msgSend;
	id visibleView = testFunc(self.window, selector, activationPoint, nil);
	
	if(visibleView == self || [visibleView isDescendantOfView:self])
	{
		return YES;
	}
	
	return NO;
}

@end
