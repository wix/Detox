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
#import "UIResponder+First.h"

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

- (void)dtx_assertVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent {
	NSError* error;
	BOOL assert = [self dtx_isVisibleAtRect:rect percent:percent error:&error];

	DTXViewAssert(assert, self.dtx_elementDebugAttributes, @"%@", error.localizedDescription);
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

		if(CGRectIsEmpty(visibleBounds))
		{
			break;
		}

		superview = superview.superview;
	}

	return visibleBounds;
}

- (BOOL)dtx_isVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent {
	return [self dtx_isVisibleAtRect:rect percent:percent error:nil];
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
										"threshold (%lu)", (unsigned long)percent];
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
														error:(NSError* __strong __nullable * __nullable)error {
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
	if (CGRectIsEmpty(visibleBounds) ||
			[self _dtx_isRegionObscured:visibleBounds fromTestedRegion:visibleBounds percent:percent]) {
		auto errorDescription = [NSString stringWithFormat:@"View is clipped by one or more of its "
														 "superviews' bounds and does not pass visibility percent "
														 "threshold (%lu)", (unsigned long)percent];

		auto userInfo = @{ NSLocalizedDescriptionKey: APPLY_PREFIX(errorDescription) };

		NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:userInfo];
		_DTXPopulateError(err);

		return NO;
	}

	if ([self _dtx_isTestedRegionObscured:testedRegionInWindowCoords
												 inWindowBounds:windowToUse.bounds percent:percent]) {
		auto errorDescription = [NSString stringWithFormat:@"View is obscured by its window bounds "
														 "and does not pass visibility percent threshold (%lu)", (unsigned long)percent];

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
											error:(NSError* __strong __nullable * __nullable)error {
	NSUInteger percentValue = percent ? percent.unsignedIntegerValue :
	DetoxPolicy.defaultPercentThresholdForVisibility;
	return [self _dtx_testVisibilityInRect:rect percent:percentValue error:error];
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

#pragma mark - Check Hitability

- (BOOL)dtx_isHittable {
	CGPoint point = [self findVisiblePoint];
	return [self dtx_isHittableAtPoint:point error:nil];
}

- (CGPoint)findVisiblePoint {
	CGRect visibleBounds = self.dtx_visibleBounds;
	if (CGRectIsEmpty(visibleBounds)) {
		return CGPointMake(NAN, NAN);
	}

	return CGPointMake(visibleBounds.origin.x + visibleBounds.size.width / 2,
										 visibleBounds.origin.y + visibleBounds.size.height / 2);
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)viewPoint
												error:(NSError* __strong __nullable * __nullable)error {
	if (viewPoint.x == NAN || viewPoint.y == NAN) {
		if (error) {
			*error = [NSError
								errorWithDomain:@"Detox" code:0
								userInfo:@{NSLocalizedDescriptionKey:@"Given point coordinates are NaN"}];
		}

		return NO;
	}

	if (![self _isVisibleAroundPoint:viewPoint error:error]) {
		if (error) {
			NSString *description = [NSString stringWithFormat:@"View is not visible around" \
															 " point.\n- view point: %@\n- visible bounds: %@" \
															 "\n- view bounds: %@\n---\nError: %@",
															 NSStringFromCGPoint(viewPoint),
															 NSStringFromCGRect(self.dtx_visibleBounds),
															 NSStringFromCGRect(self.frame), *error];

			*error = [NSError errorWithDomain:@"Detox" code:0
															 userInfo:@{NSLocalizedDescriptionKey:description}];

		}

		return NO;
	}

	CGPoint absPoint = [self calcAbsPointFromLocalPoint:viewPoint];

	UIView * _Nullable visibleContainer = [self _topMostViewOverlayAtPoint:absPoint];

	if (!visibleContainer) {
		UIViewController * _Nullable topMostViewController = [self _topMostViewControllerAtPoint:absPoint];
		if (!topMostViewController) {
			if (error) {
				NSString *description = [NSString stringWithFormat:@"Failed to interact with the screen "
																 "at point: %@.", NSStringFromCGPoint(viewPoint)];
				*error = [NSError
									errorWithDomain:@"Detox" code:0
									userInfo:@{NSLocalizedDescriptionKey:description}];
			}

			return NO;
		}

		visibleContainer = topMostViewController.view;
	}

	if ([self isDescendantOfView:visibleContainer]) {
		return [self _canHitFromView:self atAbsPoint:absPoint error:error];
	}

	UIView *firstResponderInputView = UIResponder.dtx_first.inputView;
	if ([self isDescendantOfView:firstResponderInputView]) {
		return [self _canHitFromView:firstResponderInputView atAbsPoint:absPoint error:error];
	}

	return [self _canHitFromView:visibleContainer atAbsPoint:absPoint error:error];
}

- (nullable UIView *)_topMostViewOverlayAtPoint:(CGPoint)point {
	UIWindow * _Nullable topMostWindow = [UIWindow dtx_topMostWindowAtPoint:point];
	if (!topMostWindow) {
		return nil;
	}

	NSArray<UIView *> *viewsAtPoint =
			[topMostWindow.subviews filteredArrayUsingPredicate:[NSPredicate
					predicateWithBlock:^BOOL(UIView *view,
																	 NSDictionary<NSString *, id> * _Nullable __unused bindings) {
		if (!CGRectContainsPoint(view.frame, point)) {
			return NO;
		}

		if (![view isVisibleAroundPoint:point]) {
			return NO;
		}

		UIView * _Nullable hit = [view hitTest:point withEvent:nil];
		if (!hit) {
			// The point lies completely outside the view's hierarchy.
			return NO;
		}

		return YES;
	}]];

	if (!viewsAtPoint.count) {
		return nil;
	}

	return viewsAtPoint.lastObject;
}

- (BOOL)isVisibleAroundPoint:(CGPoint)point {
	return [self _isVisibleAroundPoint:point error:nil];
}

- (BOOL)_isVisibleAroundPoint:(CGPoint)point error:(NSError* __strong __nullable * __nullable)error {
	CGRect intersection = CGRectIntersection(
	    self.dtx_visibleBounds, CGRectMake(point.x - 0.5, point.y - 0.5, 1, 1));
	return [self _dtx_testVisibilityInRect:intersection percent:100 error:error];
}

- (BOOL)_canHitFromView:(UIView *)originView atAbsPoint:(CGPoint)point
									error:(NSError* __strong __nullable * __nullable)error {
	CGPoint absOrigin = [originView calcAbsOrigin];
	CGPoint relativePoint = CGPointMake(point.x - absOrigin.x, point.y - absOrigin.y);

	UIView *hit = [originView hitTest:relativePoint withEvent:nil];

	BOOL hitRemainedOnOrigin = !hit;
	if (hitRemainedOnOrigin && originView == self) {
		return YES;
	}

	if ([hit isDescendantOfView:self]) {
		return YES;
	}

	if (error) {
		NSString *hint = [self isDescendantOfView:hit] ?
				@"\n- Hint: The Target view is a descendant of the hit view" : @"";

		NSString *errorMessage =
		[NSString stringWithFormat:@"Failed to hit view %@at point %@ with hit-test\n" \
		 "- Origin view: %@\n" \
		 "- Absolute origin: %@\n" \
		 "- Hit: %@%@\n" \
		 "- Target view: %@\n" \
		 "- Relative point: %@%@",
		 self.accessibilityIdentifier ?
				[NSString stringWithFormat:@"with identifier `%@` ", self.accessibilityIdentifier] :
				@"",
		 NSStringFromCGPoint(point),
		 originView,
		 NSStringFromCGPoint(absOrigin),
		 hit,
		 hit.accessibilityIdentifier ?
				[NSString stringWithFormat:@" (identifier: `%@`)", hit.accessibilityIdentifier] :
				@"",
		 self,
		 NSStringFromCGPoint(relativePoint),
		 hint
		];

		*error = [NSError errorWithDomain:@"Detox" code:0
														 userInfo:@{NSLocalizedDescriptionKey:errorMessage}];
	}

	return NO;
}

- (nullable UIViewController *)_topMostViewControllerAtPoint:(CGPoint)point {
	UIWindow * _Nullable topMostWindow = [UIWindow dtx_topMostWindowAtPoint:point];
	if (!topMostWindow) {
		return nil;
	}

	return [self _topMostViewControllerForViewController:topMostWindow.rootViewController];
}

- (UIViewController *)_topMostViewControllerForViewController:(UIViewController *)viewController {
	if (viewController.presentedViewController) {
		return [self _topMostViewControllerForViewController:viewController.presentedViewController];
	}

	return viewController;
}

- (void)dtx_assertHittable {
	CGPoint point = [self findVisiblePoint];
	[self dtx_assertHittableAtPoint:point];
}

- (void)dtx_assertHittableAtPoint:(CGPoint)point {
	NSError *error;
	DTXAssert([self dtx_isHittableAtPoint:point error:&error],
						@"View is not hittable at its visible point. Error: %@", error.localizedDescription);
}

- (CGPoint)calcAbsOrigin {
	return [self.superview calcAbsPointFromLocalPoint:self.frame.origin];
}

- (CGPoint)calcAbsPointFromLocalPoint:(CGPoint)localPoint {
	return [self convertPoint:localPoint toView:nil];
}

@end
