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
#import "UISlider+DetoxUtils.h"
#import "UIImage+DetoxUtils.h"
#import "UIView+Drawing.h"
#import "DetoxPolicy.h"

@interface DTXTouchVisualizerWindow : UIWindow @end

//#ifdef DEBUG
//#define _DTXPopulateError(errOut) { NSLog(@"🤦‍♂️ %@", errOut); if(error) { *error = (errOut); } }
//#else
#define _DTXPopulateError(errOut) if(error) { *error = (errOut); }
//#endif
#define APPLY_PREFIX(...) [NSString stringWithFormat:@"%@ %@", prefix, __VA_ARGS__]

DTX_ALWAYS_INLINE
static id DTXJSONSafeNSNumberOrString(double d)
{
	return isnan(d) ? @"NaN" : @(d);
}

DTX_ALWAYS_INLINE
static NSDictionary* DTXInsetsToDictionary(UIEdgeInsets insets)
{
	return @{@"top": DTXJSONSafeNSNumberOrString(insets.top), @"bottom": DTXJSONSafeNSNumberOrString(insets.bottom), @"left": DTXJSONSafeNSNumberOrString(insets.left), @"right": DTXJSONSafeNSNumberOrString(insets.right)};
}

DTX_ALWAYS_INLINE
static NSDictionary* DTXRectToDictionary(CGRect rect)
{
	return @{@"x": DTXJSONSafeNSNumberOrString(rect.origin.x), @"y": DTXJSONSafeNSNumberOrString(rect.origin.y), @"width": DTXJSONSafeNSNumberOrString(rect.size.width), @"height": DTXJSONSafeNSNumberOrString(rect.size.height)};
}

DTX_ALWAYS_INLINE
static NSDictionary* DTXPointToDictionary(CGPoint point)
{
	return @{@"x": DTXJSONSafeNSNumberOrString(point.x), @"y": DTXJSONSafeNSNumberOrString(point.y)};
}

DTX_ALWAYS_INLINE
static NSString* DTXPointToString(CGPoint point)
{
	return [[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:DTXPointToDictionary(point) options:0 error:NULL] encoding:NSUTF8StringEncoding];
}

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
	NSError* error;
	BOOL assert = [self dtx_isVisibleAtPoint:point error:&error];
	
	DTXViewAssert(assert == YES, self.dtx_viewDebugAttributes, @"%@", error.localizedDescription);
}

- (void)_dtx_assertHittableAtPoint:(CGPoint)point isAtActivationPoint:(BOOL)isAtActivationPoint
{
	NSError* error;
	BOOL assert = [self dtx_isHittableAtPoint:point error:&error];
	
	DTXViewAssert(assert == YES, self.dtx_viewDebugAttributes, @"%@", error.localizedDescription);
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

- (BOOL)dtx_isVisible
{
	return [self dtx_isVisibleAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace error:NULL];
}

- (BOOL)dtx_isVisibleAtPoint:(CGPoint)point
{
	return [self dtx_isVisibleAtPoint:point error:NULL];
}

- (UIImage*)_dtx_imageForVisibilityTestingInWindow:(UIWindow*)windowToUse testedView:(UIView*)testedView drawTestedRectWithColor:(UIColor*)testedRectColor
{
	UIGraphicsBeginImageContextWithOptions(windowToUse.bounds.size, NO, windowToUse.screen.scale);
	
	id scene = nil;
	if(@available(iOS 13.0, *))
	{
		scene = windowToUse.windowScene;
	}
	
	NSArray<UIWindow*>* windows = [UIWindow dtx_allWindowsForScene:scene];
	NSUInteger indexOfTestedWindow = [windows indexOfObject:windowToUse];
	
	DTXAssert(indexOfTestedWindow != NSNotFound, @"Window hierarchy mutated while iterated; should not happen");
	
	[windowToUse dtx_drawViewHierarchyUpToSubview:testedView inRect:windowToUse.bounds afterScreenUpdates:NO];
	
	for (NSUInteger idx = indexOfTestedWindow + 1; idx < windows.count; idx++) {
		UIWindow* currentWindow = windows[idx];
		
		[currentWindow drawViewHierarchyInRect:currentWindow.bounds afterScreenUpdates:NO];
	}
	
	//Overlay the keyboard scene windows on top
	if(@available(iOS 13.0, *))
	{
		scene = [UIWindowScene _keyboardWindowSceneForScreen:windowToUse.screen create:NO];
		if(scene != nil)
		{
			windows = [UIWindow dtx_allWindowsForScene:scene];
			
			for (UIWindow* keyboardSceneWindow in windows) {
				[keyboardSceneWindow drawViewHierarchyInRect:keyboardSceneWindow.bounds afterScreenUpdates:NO];
			}
		}
	}
	
	if(testedRectColor != nil)
	{
		CGContextRef ctx = UIGraphicsGetCurrentContext();
		CGRect testedRect = [windowToUse convertRect:testedView.bounds fromView:testedView];
		CGContextSetLineWidth(ctx, 1);
		[testedRectColor setStroke];
		CGContextStrokeRect(ctx, testedRect);
	}
	
	UIImage* rv = UIGraphicsGetImageFromCurrentImageContext();
	UIGraphicsEndImageContext();
	
	return rv;
}

- (BOOL)_dtx_isTestedRegionWithVisiblePixelsObscured:(NSUInteger)visible totalPixels:(NSUInteger)total ofView:(UIView*)lookingFor
{
	return (visible / (double)total) < DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThreshold;
}

- (BOOL)_dtx_isTestedRegionObscured:(CGRect)testedRegion inWindowBounds:(CGRect)windowBounds
{
	CGRect intersection = CGRectIntersection(windowBounds, testedRegion);
	return (intersection.size.width * intersection.size.height) / (testedRegion.size.width * testedRegion.size.height) < DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThreshold;
}

- (BOOL)dtx_isVisibleAtPoint:(CGPoint)point error:(NSError* __strong *)error
{
	NSString* prefix = [NSString stringWithFormat:@"View “%@” is not visible;", self.dtx_shortDescription];
	
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
	
	if(@available(iOS 13.0, *))
	{
		if(windowToUse.windowScene == nil)
		{
			_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"Window scene is nil")}]);
			return NO;
		}
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"View is hidden or has hidden ancestor")}]);
		
		return NO;
	}
	
	UIScreen* screen = windowToUse.screen;
	CGPoint screenActivationPoint = [self convertPoint:point toCoordinateSpace:screen.coordinateSpace];
	CGRect windowTestedRegion = [windowToUse convertRect:self.bounds fromView:self];
	
	if([self _dtx_isTestedRegionObscured:windowTestedRegion inWindowBounds:windowToUse.bounds])
	{
		NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"View “%@” does not pass visibility threshold (%@) within window bounds", self.dtx_shortDescription, DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThresholdDescription])}];
		_DTXPopulateError(err);
		
		return NO;
	}
	
	UIImage* image = [self _dtx_imageForVisibilityTestingInWindow:windowToUse testedView:self drawTestedRectWithColor:nil];
	CGRect testedRect = [windowToUse convertRect:self.bounds fromView:self];
	image = [image dtx_imageByCroppingInRect:testedRect];
	
	NSUInteger total;
	NSUInteger visible = [image dtx_numberOfVisiblePixelsWithAlphaThreshold:DetoxPolicy.activePolicy.visibilityPixelAlphaThreshold totalPixels:&total];
	
	if([self _dtx_isTestedRegionWithVisiblePixelsObscured:visible totalPixels:total ofView:self] == YES)
	{
		NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"View “%@” does not pass visibility threshold (%@)", self.dtx_shortDescription, DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThresholdDescription])}];
		_DTXPopulateError(err);
		
#if DEBUG
//		[image dtx_saveToDesktop];
//		[[self _dtx_imageForVisibilityTestingInWindow:windowToUse testedView:self drawTestedRectWithColor:UIColor.blackColor] dtx_saveToDesktop];
#endif
		
		return NO;
	}
	
	return YES;
}

- (BOOL)dtx_isHittable
{
	return [self dtx_isHittableAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace];
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point
{
	return [self dtx_isHittableAtPoint:point error:NULL];
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point error:(NSError* __strong *)error
{
	return [self dtx_isVisibleAtPoint:point error:error];
}

- (NSDictionary<NSString *,id> *)dtx_attributes
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	
	NSDictionary* results = [self dictionaryWithValuesForKeys:@[@"text", @"accessibilityLabel", @"accessibilityIdentifier", @"accessibilityValue", @"placeholder"]];
	[results enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
		if([obj isKindOfClass:NSNull.class])
		{
			return;
		}
		
		if([key isEqualToString:@"accessibilityLabel"])
		{
			rv[@"label"] = obj;
		}
		else if([key isEqualToString:@"accessibilityValue"])
		{
			rv[@"value"] = obj;
		}
		else if([key isEqualToString:@"accessibilityIdentifier"])
		{
			rv[@"identifier"] = obj;
		}
		else
		{
			rv[key] = obj;
		}
	}];
	
	BOOL enabled = self.userInteractionEnabled;
	if([self isKindOfClass:UIControl.class])
	{
		enabled = enabled && [[self valueForKey:@"enabled"] boolValue];
	}
	rv[@"enabled"] = enabled ? @YES : @NO;
	
	rv[@"frame"] = DTXRectToDictionary(self.dtx_accessibilityFrame);
	rv[@"elementFrame"] = DTXRectToDictionary(self.frame);
	rv[@"elementBounds"] = DTXRectToDictionary(self.bounds);
	rv[@"safeAreaInsets"] = DTXInsetsToDictionary(self.safeAreaInsets);
	rv[@"elementSafeBounds"] = DTXRectToDictionary(self.dtx_safeAreaBounds);
	
	CGPoint accessibilityActivationPointInViewCoordinateSpace = self.dtx_accessibilityActivationPointInViewCoordinateSpace;
	rv[@"activationPoint"] = DTXPointToDictionary(accessibilityActivationPointInViewCoordinateSpace);
	rv[@"normalizedActivationPoint"] = DTXPointToDictionary(CGPointMake(CGRectGetWidth(self.bounds) == 0 ? 0 : accessibilityActivationPointInViewCoordinateSpace.x / CGRectGetWidth(self.bounds), CGRectGetHeight(self.bounds) == 0 ? 0 : accessibilityActivationPointInViewCoordinateSpace.y / CGRectGetHeight(self.bounds)));
	
	rv[@"hittable"] = self.dtx_isHittable ? @YES : @NO;
	rv[@"visible"] = self.dtx_isVisible ? @YES : @NO;
	
	if([self isKindOfClass:UISlider.class])
	{
		rv[@"normalizedSliderPosition"] = @([(UISlider*)self dtx_normalizedSliderPosition]);
	}
	
	if([self isKindOfClass:UIDatePicker.class])
	{
		UIDatePicker* dp = (id)self;
		rv[@"date"] = [NSISO8601DateFormatter stringFromDate:dp.date timeZone:dp.timeZone ?: NSTimeZone.systemTimeZone formatOptions:NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithDashSeparatorInDate | NSISO8601DateFormatWithColonSeparatorInTime | NSISO8601DateFormatWithColonSeparatorInTimeZone];
		NSDateComponents* dc = [dp.calendar componentsInTimeZone:dp.timeZone ?: NSTimeZone.systemTimeZone fromDate:dp.date];
		
		NSMutableDictionary* dateComponents = [NSMutableDictionary new];
		dateComponents[@"era"] = @(dc.era);
		dateComponents[@"year"] = @(dc.year);
		dateComponents[@"month"] = @(dc.month);
		dateComponents[@"day"] = @(dc.day);
		dateComponents[@"hour"] = @(dc.hour);
		dateComponents[@"minute"] = @(dc.minute);
		dateComponents[@"second"] = @(dc.second);
		dateComponents[@"weekday"] = @(dc.weekday);
		dateComponents[@"weekdayOrdinal"] = @(dc.weekdayOrdinal);
		dateComponents[@"quarter"] = @(dc.quarter);
		dateComponents[@"weekOfMonth"] = @(dc.weekOfMonth);
		dateComponents[@"weekOfYear"] = @(dc.weekOfYear);
		dateComponents[@"leapMonth"] = @(dc.leapMonth);
		
		rv[@"dateComponents"] = dateComponents;
	}
	
	return rv;
}

- (NSDictionary<NSString *,id> *)dtx_viewDebugAttributes
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	
	if(self.window != nil)
	{
		rv[@"viewHierarchy"] = self.window.recursiveDescription;
	}
	
	rv[@"elementAttributes"] = [self dtx_attributes];
	rv[@"viewDescription"] = self.description;
	
	return rv;
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

#if DEBUG
- (void)dtx_saveSnapshotToDesktop
{
	[self _dtx_saveSnapshotToDesktopWithPointPtr:NULL rects:nil];
}

- (void)dtx_saveSnapshotToDesktopWithPoint:(CGPoint)point rects:(NSArray*)rects
{
	[self _dtx_saveSnapshotToDesktopWithPointPtr:&point rects:rects];
}

- (void)_dtx_saveSnapshotToDesktopWithPointPtr:(CGPoint*)pointPtrOrNULL rects:(NSArray*)rects
{
	UIWindow* windowToUse = [self isKindOfClass:UIWindow.class] ? (id)self : self.window;
	UIGraphicsBeginImageContextWithOptions(self.bounds.size, NO, windowToUse.screen.scale);
	[self drawViewHierarchyInRect:self.bounds afterScreenUpdates:NO];
	
	if(pointPtrOrNULL != NULL)
	{
		CGContextRef ctx = UIGraphicsGetCurrentContext();
		[UIColor.blackColor setFill];
		CGContextFillRect(ctx, CGRectMake(pointPtrOrNULL->x - 0.5, pointPtrOrNULL->y - 0.5, 1, 1));
	}
	
	[rects enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		CGRect rect = [obj CGRectValue];
		
		CGContextRef ctx = UIGraphicsGetCurrentContext();
		[UIColor.blackColor setStroke];
		CGContextSetLineWidth(ctx, 1.0);
		CGContextStrokeRect(ctx, rect);
	}];
	
	UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
	UIGraphicsEndImageContext();
	
	[image dtx_saveToDesktop];
}
#endif

@end
