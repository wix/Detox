//
//  UIView+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/27/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+DetoxUtils.h"
#import "DTXAppleInternals.h"
#import "UIWindow+DetoxUtils.h"

@import ObjectiveC;

BOOL __DTXDoulbeEqualToDouble(double a, double b)
{
	double difference = fabs(a * .00001);
	return fabs(a - b) <= difference;
}

BOOL __DTXPointEqualToPoint(CGPoint a, CGPoint b)
{
	return __DTXDoulbeEqualToDouble(floor(a.x), floor(b.x)) && __DTXDoulbeEqualToDouble(floor(a.y), floor(b.y));
}

@implementation UIView (DetoxUtils)

- (void)dtx_assertVisible
{
	[self _dtx_assertVisibleAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace isAtActivationPoint:YES];
}

- (void)dtx_assertHittable
{
	[self _dtx_assertHittableAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace isAtActivationPoint:YES];
}

- (void)dtx_assertVisibleAtPoint:(CGPoint)point
{
	[self _dtx_assertVisibleAtPoint:point isAtActivationPoint:NO];
}

- (void)dtx_assertHittableAtPoint:(CGPoint)point
{
	[self _dtx_assertHittableAtPoint:point isAtActivationPoint:NO];
}

- (void)_dtx_assertVisibleAtPoint:(CGPoint)point isAtActivationPoint:(BOOL)isAtActivationPoint
{
	DTXViewAssert([self dtx_isVisibleAtPoint:point] == YES, self, @"View “%@” is not visible%@", self.dtx_shortDescription, !isAtActivationPoint ? [NSString stringWithFormat:@" at point “(x: %@, y: %@)”", @(point.x), @(point.y)] : @"");
}

- (void)_dtx_assertHittableAtPoint:(CGPoint)point isAtActivationPoint:(BOOL)isAtActivationPoint
{
	DTXViewAssert([self dtx_isHittableAtPoint:point] == YES, self, @"View “%@” is not hittable%@", self.dtx_shortDescription, !isAtActivationPoint ? [NSString stringWithFormat:@" at point “(x: %@, y: %@)”", @(point.x), @(point.y)] : @"");
}

- (NSString *)dtx_shortDescription
{
	return [NSString stringWithFormat:@"<%@: %p>", self.class, self];
}

- (CGRect)dtx_accessibilityFrame
{
	CGRect accessibilityFrame = self.accessibilityFrame;
	if(CGRectEqualToRect(accessibilityFrame, CGRectZero))
	{
		accessibilityFrame = [self.window.screen.coordinateSpace convertRect:self.bounds fromCoordinateSpace:self.coordinateSpace];
	}
	return accessibilityFrame;
}

- (CGRect)dtx_safeAreaBounds
{
	return UIEdgeInsetsInsetRect(self.bounds, self.safeAreaInsets);
}

- (CGPoint)dtx_accessibilityActivationPoint
{
	CGPoint activationPoint = self.accessibilityActivationPoint;
	if(CGPointEqualToPoint(activationPoint, CGPointZero))
	{
		activationPoint = [self.coordinateSpace convertPoint:CGPointMake(CGRectGetMidX(self.dtx_safeAreaBounds), CGRectGetMidY(self.dtx_safeAreaBounds)) toCoordinateSpace:self.window.screen.coordinateSpace];
	}
	return activationPoint;
}

- (CGPoint)dtx_accessibilityActivationPointInViewCoordinateSpace
{
	return [self.window.screen.coordinateSpace convertPoint:self.dtx_accessibilityActivationPoint toCoordinateSpace:self.coordinateSpace];
}

- (UIView *)dtx_hitTest:(CGPoint)point withEvent:(UIEvent *)event lookingFor:(UIView*)lookingFor
{
	return [self hitTest:point withEvent:event];
}

- (UIView*)dtx_visTest_faster:(CGPoint)point withEvent:(UIEvent *)event lookingFor:(UIView*)lookingFor
{
	if(self.isHiddenOrHasHiddenAncestor == YES)
 	{
 		return nil;
 	}

 	if(self.alpha == 0.0)
 	{
 		return nil;
 	}

 	if([self pointInside:point withEvent:event] == NO)
 	{
 		return nil;
 	}

 	__block UIView* rv;

 	NSMutableOrderedSet<UIView*>* candidates = [NSMutableOrderedSet new];

 	//Front-most views get priority
 	[self.subviews enumerateObjectsWithOptions:NSEnumerationReverse usingBlock:^(__kindof UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
 		CGPoint localPoint = [self convertPoint:point toView:obj];

 		UIView* candidate = [obj dtx_visTest:localPoint withEvent:event lookingFor:lookingFor];

 		if(candidate != nil)
 		{
 			[candidates addObject:candidate];
 		}
 	}];

 	//TODO: Consider some strategy to tackle "visible" views under transparent views.
 	rv = candidates.firstObject;

 	if(rv == nil)
 	{
 		rv = self;
 	}

 	return rv;
}

- (UIView*)dtx_visTest:(CGPoint)point withEvent:(UIEvent *)event lookingFor:(UIView*)lookingFor
{
	if(self.isHiddenOrHasHiddenAncestor == YES)
	{
		return nil;
	}

	if(self.alpha == 0.0)
	{
		return nil;
	}

	if([self pointInside:point withEvent:event] == NO)
	{
		return nil;
	}

	if(self == lookingFor)
	{
		//Take a shortcut here, because we found ourselves
		return self;
	}

	__block UIView* rv;

	//Front-most views get priority
	[self.subviews enumerateObjectsWithOptions:NSEnumerationReverse usingBlock:^(__kindof UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		CGPoint localPoint = [self convertPoint:point toView:obj];

		UIView* candidate = [obj dtx_visTest:localPoint withEvent:event lookingFor:lookingFor];

		if(candidate == nil)
		{
			return;
		}

		rv = candidate;
		*stop = YES;
	}];

	if(rv == nil)
	{
		//Check the candidate view for transparency
		UIImage* img = [self dtx_imageAroundPoint:point];
		[UIImagePNGRepresentation(img) writeToFile:@"/Users/lnatan/Desktop/view.png" atomically:YES];
		if([UIView _dtx_isImageTransparent:img] == NO)
		{
			//If a view is not transparent around the hit point, take it as the visible view.
			rv = self;
		}
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
	return [self _dtx_someTestAtPoint:point testSelector:@selector(dtx_visTest:withEvent:lookingFor:)];
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point
{
	if([self isKindOfClass:NSClassFromString(@"UISegmentLabel")] || [self isKindOfClass:NSClassFromString(@"UISegment")])
	{
		UISegmentedControl* segmentControl = (id)self;
		while(segmentControl != nil && [segmentControl isKindOfClass:UISegmentedControl.class] == NO)
		{
			segmentControl = (id)segmentControl.superview;
		}

		return [segmentControl dtx_isHittableAtPoint:[segmentControl convertPoint:point fromView:self]];
	}
	
	return [self _dtx_someTestAtPoint:point testSelector:@selector(dtx_hitTest:withEvent:lookingFor:)];
}

- (BOOL)_dtx_someTestAtPoint:(CGPoint)point testSelector:(SEL)selector
{
	if(self.window == nil || self.window.screen == nil)
	{
		return NO;
	}
	
	if(@available(iOS 13.0, *))
	{
		if(self.window.windowScene == nil)
		{
			return NO;
		}
	}
	
	//Point in window coordinate space
	UIScreen* screen = self.window.screen;
	CGPoint screenActivationPoint = [self convertPoint:point toCoordinateSpace:screen.coordinateSpace];
	CGPoint windowActivationPoint = [self.window convertPoint:point fromView:self];
	
	if(CGRectContainsPoint(self.window.bounds, windowActivationPoint) == NO)
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
	
	__block BOOL rv = NO;
	
	id (*testFunc)(id, SEL, CGPoint, id, id) = (void*)objc_msgSend;
	
	id scene = nil;
	if(@available(iOS 13.0, *))
	{
		scene = self.window.windowScene;
	}
	
	[UIWindow dtx_enumerateWindowsInScene:scene usingBlock:^(UIWindow * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		if(obj.screen != screen)
		{
			//Irrelevant window, ignore
			return;
		}
		
		CGPoint currentWindowActivationPoint = [screen.coordinateSpace convertPoint:screenActivationPoint toCoordinateSpace:obj.coordinateSpace];
		
		if(self.window != obj && selector == @selector(dtx_visTest:withEvent:lookingFor:))
		{
			UIImage* windowImage = [obj dtx_imageAroundPoint:currentWindowActivationPoint];
//			[UIImagePNGRepresentation(windowImage) writeToFile:[NSString stringWithFormat:@"/Users/lnatan/Desktop/%@.png", NSStringFromClass(obj.class)] atomically:YES];
			if([UIView _dtx_isImageTransparent:windowImage] == NO)
			{
				//The window is not transparent at the hit point, stop
				rv = NO;
				*stop = YES;
				return;
			}
			else
			{
				//The window is transparent at the hit point, continue to next window
				return;
			}
		}
		
		UIView* visibleView = testFunc(obj, selector, currentWindowActivationPoint, nil, self);
		
		if(self.window != obj && selector == @selector(dtx_hitTest:withEvent:lookingFor:) && visibleView != nil)
		{
			//We've hit a view in another window
			rv = NO;
			*stop = YES;
		}
		
		if(visibleView == self || [visibleView isDescendantOfView:self])
		{
			rv = YES;
			*stop = YES;
		}
	}];
	
	return rv;
}

+ (BOOL)_dtx_isImageTransparent:(UIImage*)image
{
	CGImageRef cgImage = image.CGImage;
		
	CFDataRef pixelData = CGDataProviderCopyData(CGImageGetDataProvider(cgImage));
	dtx_defer {
		CFRelease(pixelData);
	};
    const UInt8* data = CFDataGetBytePtr(pixelData);
	
	for (NSUInteger x = 0; x < image.size.width; x++) {
		for (NSUInteger y = 0; y < image.size.height; y++) {
			uint8_t alpha = data[((NSUInteger)image.size.width * y + x) * 4 + 3];
			if(alpha != 0)
			{
				return NO;
			}
		}
	}
	
	return YES;
}

- (UIImage*)dtx_imageAroundPoint:(CGPoint)point
{
	static const CGFloat maxSize = 44;
	CGFloat width = ceil(MIN(maxSize, self.bounds.size.width));
	CGFloat height = ceil(MIN(maxSize, self.bounds.size.height));
	CGFloat x = MAX(0, point.x - width / 2.0);
	CGFloat y = MAX(0, point.y - height / 2.0);
	
	CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
	if (colorSpace == NULL)
	{
		return nil;
	}
	dtx_defer {
		CGColorSpaceRelease(colorSpace);
	};
	
	CGContextRef context = CGBitmapContextCreate(NULL, width, height, 8, width * 4, colorSpace, (CGBitmapInfo)kCGImageAlphaPremultipliedFirst);
	if(context == NULL)
	{
		return nil;
	}
	dtx_defer {
		CGContextRelease(context);
	};
	
	UIGraphicsPushContext(context);
	
	CGContextTranslateCTM(context, -x, -y);
	
	[self.layer renderInContext:context];
	
	UIGraphicsPopContext();
	
	CGImageRef imageRef = CGBitmapContextCreateImage(context);
	dtx_defer {
		CGImageRelease(imageRef);
	};
	
	UIImage* image = [UIImage imageWithCGImage:imageRef];
	
	return image;
}

@end
