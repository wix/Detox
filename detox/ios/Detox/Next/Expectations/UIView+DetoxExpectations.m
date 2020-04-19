//
//  UIView+DetoxExpectations.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/19/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+DetoxExpectations.h"
#import "DTXAppleInternals.h"

@implementation UIView (DetoxExpectations)

- (UIView*)dtx_visTest:(CGPoint)point withEvent:(UIEvent *)event;
{
	NSLog(@"Visiting %@", self);
	
	CGPoint localPoint = [self.window.screen.coordinateSpace convertPoint:point toCoordinateSpace:self.coordinateSpace];
	if([self pointInside:localPoint withEvent:event] == NO)
	{
		NSLog(@"- NOPE: !pointInside, frame: %@, point: %@, localPoint: %@", @([self.window.screen.coordinateSpace convertRect:self.bounds fromCoordinateSpace:self.coordinateSpace]), @(point), @(localPoint));
		
		return nil;
	}
	
	if(self.isHiddenOrHasHiddenAncestor == YES)
	{
		NSLog(@"- NOPE: hidden");
		
		return nil;
	}
	
	__block UIView* rv;
	
	//Front-most views get priority
	[self.subviews enumerateObjectsWithOptions:NSEnumerationReverse usingBlock:^(__kindof UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		rv = [obj dtx_visTest:point withEvent:event];
		
		if(rv != nil)
		{
			NSLog(@"+ YEP: Using child %@", rv);
			*stop = YES;
		}
	}];
	
	if(rv == nil)
	{
		NSLog(@"+ YEP: self %@", self);
		rv = self;
	}
	
	return rv;
}

- (BOOL)dtx_isVisible
{
	if(CGRectContainsPoint(self.window.screen.bounds, self.accessibilityActivationPoint) == NO)
	{
		return NO;
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		return NO;
	}
	
	//Activation point in window coordinate space
	CGPoint activationPoint = [self.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:self.window.coordinateSpace];
	
	
	id visibleView = [self.window dtx_visTest:activationPoint withEvent:nil];
	
	if(visibleView == self || [visibleView isDescendantOfView:self])
	{
		return YES;
	}
	
	return NO;
}

- (BOOL)dtx_isHittable
{
	if(CGRectContainsPoint(self.window.screen.bounds, self.accessibilityActivationPoint) == NO)
	{
		return NO;
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		return NO;
	}
	
	//Activation point in window coordinate space
	CGPoint activationPoint = [self.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:self.window.coordinateSpace];
	
	
	id hitTestView = [self.window hitTest:activationPoint withEvent:nil];
	
	if(hitTestView == self || [[hitTestView _accessibilityHitTestSubviews] containsObject:self] || [[self _accessibilityHitTestSubviews] containsObject:hitTestView])
	{
		return YES;
	}
	
	return NO;
}

@end
