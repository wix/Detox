//
//  UIView+Detox.m
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

#import "UIView+DetoxActions.h"
#import "DTXAppleInternals.h"
#import "DTXSyntheticEvents.h"

@implementation UIView (Detox)

- (CGPoint)_dtx_accessibilityActivationPointInViewCoordinateSpace
{
	return [self.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:self.coordinateSpace];
}

- (void)dtx_tapAtAccessibilityActivationPoint
{
	[self dtx_tapAtPoint:self._dtx_accessibilityActivationPointInViewCoordinateSpace numberOfTaps:1];
}

- (void)dtx_tapAtPoint:(CGPoint)point numberOfTaps:(NSUInteger)numberOfTaps
{
	NSParameterAssert(numberOfTaps >= 1);
	point = [self.window convertPoint:point fromView:self];
	for (NSUInteger idx = 0; idx < numberOfTaps; idx++) {
		[DTXSyntheticEvents touchAlongPath:@[@(point)] relativeToWindow:self.window forDuration:0 expendable:NO];
	}
}

- (void)dtx_longPressAtAccessibilityActivationPoint
{
	[self dtx_longPressAtAccessibilityActivationPointForDuration:1.0];
}

- (void)dtx_longPressAtAccessibilityActivationPointForDuration:(NSTimeInterval)duration
{
	[self dtx_longPressAtPoint:self._dtx_accessibilityActivationPointInViewCoordinateSpace duration:duration];
}

- (void)dtx_longPressAtPoint:(CGPoint)point duration:(NSTimeInterval)duration
{
	point = [self.window convertPoint:point fromView:self];
	[DTXSyntheticEvents touchAlongPath:@[@(point)] relativeToWindow:self.window forDuration:duration expendable:NO];
}

@end
