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
#import "UIImage+DetoxUtils.h"
#import "UIView+Drawing.h"
#import "DetoxPolicy.h"
#import "NSURL+DetoxUtils.h"

@interface DTXTouchVisualizerWindow : UIWindow @end

//#ifdef DEBUG
//#define _DTXPopulateError(errOut) { NSLog(@"🤦‍♂️ %@", errOut); if(error) { *error = (errOut); } }
//#else
#define _DTXPopulateError(errOut) if(error) { *error = (errOut); }
//#endif
#define APPLY_PREFIX(...) [NSString stringWithFormat:@"%@ %@", prefix, __VA_ARGS__]

@import ObjectiveC;

DTX_DIRECT_MEMBERS
@implementation UIView (DetoxUtils)

- (void)dtx_assertHittable
{
	[self _dtx_assertHittableAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace isAtActivationPoint:YES];
}

- (void)dtx_assertVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent {
	NSError* error;
	BOOL assert = [self dtx_isVisibleAtRect:rect percent:percent error:&error];
	
	DTXViewAssert(assert, self.dtx_elementDebugAttributes, @"%@", error.localizedDescription);
}

- (void)dtx_assertHittableAtPoint:(CGPoint)point
{
	[self _dtx_assertHittableAtPoint:point isAtActivationPoint:NO];
}

- (void)_dtx_assertHittableAtPoint:(CGPoint)point isAtActivationPoint:(BOOL)isAtActivationPoint
{
	NSError* error;
	BOOL assert = [self dtx_isHittableAtPoint:point error:&error];
	
	DTXViewAssert(assert == YES, self.dtx_elementDebugAttributes, @"%@", error.localizedDescription);
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
	UIWindow* windowToUse = [self isKindOfClass:UIWindow.class] ? (id)self : self.window;
	
	return [windowToUse.screen.coordinateSpace convertPoint:self.dtx_accessibilityActivationPoint toCoordinateSpace:self.coordinateSpace];
}

- (CGRect)dtx_contentBounds
{
	CGRect contentBounds = self.bounds;
	
	if(self.clipsToBounds == YES)
	{
		return contentBounds;
	}
	
	for (UIView* subview in self.subviews) {
		contentBounds = CGRectUnion(contentBounds, subview.dtx_contentBounds);
	}
	
	return contentBounds;
}

- (CGRect)dtx_visibleBounds
{
	CGRect visibleBounds = self.bounds;
	
	UIView* superview = self.superview;
	while(superview != nil)
	{
		if([superview clipsToBounds] == YES)
		{
			CGRect boundsInSelfCoords = [self convertRect:superview.bounds fromView:superview];
			visibleBounds = CGRectIntersection(boundsInSelfCoords, visibleBounds);
		}
		
		if(CGRectIsNull(visibleBounds))
		{
			break;
		}
		
		superview = superview.superview;
	}
	
	return visibleBounds;
}

- (BOOL)dtx_isVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent {
	return [self dtx_isVisibleAtRect:rect percent:percent error:NULL];
}

- (UIImage*)dtx_imageFromView
{
	UIWindow* window = [self isKindOfClass:UIWindow.class] ? (id)self : self.window;
	CGFloat scale = window != nil ? window.screen.scale : 0.0;
	UIGraphicsBeginImageContextWithOptions(self.bounds.size, NO, scale);

	[self.layer renderInContext:UIGraphicsGetCurrentContext()];

	UIImage *image= UIGraphicsGetImageFromCurrentImageContext();
	UIGraphicsEndImageContext();

	return image;
}

- (UIImage*)_dtx_imageForVisibilityTestingInWindow:(UIWindow*)windowToUse testedView:(UIView*)testedView inRect:(CGRect)testedRect drawTestedRect:(BOOL)drawTestedRect
{
	UIGraphicsBeginImageContextWithOptions(windowToUse.bounds.size, NO, windowToUse.screen.scale);
	
	UIWindowScene* scene = windowToUse.windowScene;
	NSArray<UIWindow*>* windows = [UIWindow dtx_allWindowsForScene:scene];
	NSUInteger indexOfTestedWindow = [windows indexOfObject:windowToUse];
	
	DTXAssert(indexOfTestedWindow != NSNotFound, @"Window hierarchy mutated while iterated; should not happen");
	
	if(testedView == nil)
	{
		[UIColor.blackColor setFill];
		[[UIBezierPath bezierPathWithRect:windowToUse.bounds] fill];
	}
	
	[windowToUse dtx_drawViewHierarchyUpToSubview:testedView inRect:windowToUse.bounds afterScreenUpdates:NO];
	
	for (NSUInteger idx = indexOfTestedWindow + 1; idx < windows.count; idx++) {
		UIWindow* currentWindow = windows[idx];
		
		[currentWindow dtx_drawViewHierarchyUpToSubview:nil inRect:currentWindow.bounds afterScreenUpdates:NO];
	}
	
	//Overlay the keyboard scene windows on top
	scene = [UIWindowScene _keyboardWindowSceneForScreen:windowToUse.screen create:NO];
	if(scene != nil)
	{
		windows = [UIWindow dtx_allWindowsForScene:scene];
		
		for (UIWindow* keyboardSceneWindow in windows) {
			if (![keyboardSceneWindow isEqual: windowToUse]) {
				[keyboardSceneWindow dtx_drawViewHierarchyUpToSubview:nil inRect:keyboardSceneWindow.bounds afterScreenUpdates:NO];
			}
		}
	}
	
	if(drawTestedRect && testedView != nil)
	{
		CGContextRef ctx = UIGraphicsGetCurrentContext();
		CGContextSetLineWidth(ctx, 1);
		CGContextSetAllowsAntialiasing(ctx, NO);
		
		CGFloat* lengths = (CGFloat[]){2.0, 2.0};
		[@[UIColor.systemRedColor, UIColor.whiteColor] enumerateObjectsUsingBlock:^(UIColor * _Nonnull color, NSUInteger idx, BOOL * _Nonnull stop) {
			CGContextSetLineDash(ctx, idx * 2.0, lengths, 2);
			[color setStroke];
			CGContextStrokeRect(ctx, testedRect);
			
//			*stop = YES;
		}];
	}
	
	UIImage* rv = UIGraphicsGetImageFromCurrentImageContext();
	UIGraphicsEndImageContext();
	
	return rv;
}

- (BOOL)_dtx_isTestedRegionObscuredWithVisiblePixels:(NSUInteger)visible
										 totalPixels:(NSUInteger)total percent:(NSUInteger)percent
											  ofView:(UIView*)lookingFor
										 explanation:(NSString**)explanation {
	BOOL isRegionObscured = [self isRegionObscuredWithVisiblePixels:visible
														totalPixels:total percent:percent];
	
	if (isRegionObscured) {
		*explanation = [NSString stringWithFormat:@"View does not pass visibility percent "
						"threshold (%@)", [DetoxPolicy percentDescriptionForPercent:percent]];
	}
	
	return isRegionObscured;
}

- (BOOL)isRegionObscuredWithVisiblePixels:(NSUInteger)visible
							  totalPixels:(NSUInteger)total percent:(NSUInteger)percent {
	CGFloat visiblePercent = visible / (CGFloat)total * 100.;
	return visiblePercent < (CGFloat)percent;
}

- (BOOL)_dtx_isRegionObscured:(CGRect)intersection fromTestedRegion:(CGRect)testedRegion
					  percent:(NSUInteger)percent {
	CGFloat visible = intersection.size.width * intersection.size.height;
	CGFloat total = testedRegion.size.width * testedRegion.size.height;
	return [self isRegionObscuredWithVisiblePixels:visible totalPixels:total percent:percent];
}

- (BOOL)_dtx_isTestedRegionObscured:(CGRect)testedRegion inWindowBounds:(CGRect)windowBounds
							percent:(NSUInteger)percent {
	CGRect intersection = CGRectIntersection(windowBounds, testedRegion);
	return [self _dtx_isRegionObscured:intersection fromTestedRegion:testedRegion percent:percent];
}

- (BOOL)_dtx_testVisibilityInRect:(CGRect)rect percent:(NSUInteger)percent
							error:(NSError* __strong *)error {
	NSString* prefix = [NSString stringWithFormat:@"View “%@” is not visible:", self.dtx_shortDescription];
	
	if(UIApplication.sharedApplication._isSpringBoardShowingAnAlert)
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"System alert is shown on screen")}]);
		
		return NO;
	}
	
	UIWindow* windowToUse = [self isKindOfClass:UIWindow.class] ? (id)self : self.window;
	
	if(windowToUse == nil || windowToUse.screen == nil)
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"Either window or screen are nil")}]);
		
		return NO;
	}
	
	if(windowToUse.windowScene == nil)
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"Window scene is nil")}]);
		return NO;
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"View is hidden or has hidden ancestor")}]);
		
		return NO;
	}
	
	CGRect testedRegionInWindowCoords = [windowToUse convertRect:rect fromView:self];
	
	CGRect visibleBounds = self.dtx_visibleBounds;
	
	if (CGRectIsNull(visibleBounds) || [self _dtx_isRegionObscured:visibleBounds
		 										  fromTestedRegion:self.dtx_visibleBounds
														   percent:percent]) {
		auto errorDescription = [NSString stringWithFormat:@"View is clipped by one or more of its "
								 "superviews' bounds and does not pass visibility percent "
								 "threshold (%@)",
								 [DetoxPolicy percentDescriptionForPercent:percent]];
		
		auto userInfo = @{ NSLocalizedDescriptionKey: APPLY_PREFIX(errorDescription) };
		
		NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:userInfo];
		_DTXPopulateError(err);
		
		return NO;
	}
	
	if ([self _dtx_isTestedRegionObscured:testedRegionInWindowCoords
						   inWindowBounds:windowToUse.bounds percent:percent]) {
		auto errorDescription = [NSString stringWithFormat:@"View is obscured by its window bounds "
								 "and does not pass visibility percent threshold (%@)",
								 [DetoxPolicy percentDescriptionForPercent:percent]];
		
		auto userInfo = @{ NSLocalizedDescriptionKey: APPLY_PREFIX(errorDescription) };
		
		NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:userInfo];
		_DTXPopulateError(err);
		
		return NO;
	}
	
	UIImage* image = [self _dtx_imageForVisibilityTestingInWindow:windowToUse testedView:self inRect:testedRegionInWindowCoords drawTestedRect:NO];
	image = [image dtx_imageByCroppingInRect:testedRegionInWindowCoords];
	
	NSUInteger total;
	NSUInteger visible = [image
	    dtx_numberOfVisiblePixelsWithAlphaThreshold:DetoxPolicy.visibilityPixelAlphaThreshold
		totalPixels:&total];
	
	NSString* explanation;
	if ([self _dtx_isTestedRegionObscuredWithVisiblePixels:visible totalPixels:total percent:percent
													ofView:self explanation:&explanation]) {
		NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(explanation)}];
		_DTXPopulateError(err);
		
		if([NSUserDefaults.standardUserDefaults boolForKey:@"detoxDebugVisibility"])
		{
			[[self _dtx_imageForVisibilityTestingInWindow:windowToUse testedView:nil inRect:testedRegionInWindowCoords drawTestedRect:NO] dtx_saveToPath:NSURL.visibilityFailingScreenshotsPath fileName:[NSString stringWithFormat:@"DETOX_VISIBILITY_%@ <%p>_SCREEN.png", NSStringFromClass(self.class), self]];
			[[self _dtx_imageForVisibilityTestingInWindow:windowToUse testedView:self inRect:testedRegionInWindowCoords drawTestedRect:YES] dtx_saveToPath:NSURL.visibilityFailingRectsPath fileName:[NSString stringWithFormat:@"DETOX_VISIBILITY_%@ <%p>_TEST.png", NSStringFromClass(self.class), self]];
		}
		
		return NO;
	}
	
	return YES;
}

- (BOOL)dtx_isVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent
					  error:(NSError* __strong *)error {
	NSUInteger percentValue = percent ? percent.unsignedIntegerValue :
		DetoxPolicy.defaultPercentThresholdForVisibility;
	return [self _dtx_testVisibilityInRect:rect percent:percentValue error:error];
}

- (BOOL)dtx_isHittable
{
	return [self dtx_isHittableAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace error:NULL];
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point
{
	return [self dtx_isHittableAtPoint:point error:NULL];
}

- (CGRect)_dtx_hitBoundsAroundPoint:(CGPoint)point {
	return CGRectIntersection(self.bounds, CGRectMake(point.x - 0.5, point.y - 0.5, 1, 1));
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point error:(NSError* __strong *)error {
	return [self _dtx_testVisibilityInRect:[self _dtx_hitBoundsAroundPoint:point] percent:100
									 error:error];
}

- (BOOL)dtx_isEnabled
{
	BOOL enabled = self.userInteractionEnabled;
	if([self isKindOfClass:UIControl.class])
	{
		enabled = enabled && [[self valueForKey:@"enabled"] boolValue];
	}
	return enabled;
}

- (void)dtx_assertEnabled
{
	DTXViewAssert(self.dtx_isEnabled == YES, self.dtx_elementDebugAttributes, @"View is not enabled.");
}

- (UIViewController *)dtx_containingViewController
{
	UIViewController* rv = (id)self.nextResponder;
	while(rv != nil && [rv isKindOfClass:UIViewController.class] == NO)
	{
		rv = (id)rv.nextResponder;
	}
	
	return rv;
}

@end
