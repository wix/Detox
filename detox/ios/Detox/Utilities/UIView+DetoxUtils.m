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
#import "DetoxPolicy.h"

@interface DTXTouchVisualizerWindow : UIWindow @end

//#ifdef DEBUG
//#define _DTXPopulateError(errOut) { NSLog(@"🤦‍♂️ %@", errOut); if(error) { *error = (errOut); } }
//#else
#define _DTXPopulateError(errOut) if(error) { *error = (errOut); }
//#endif

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

- (UIView *)dtx_hitTest:(CGPoint)point withEvent:(UIEvent *)event lookingFor:(UIView*)lookingFor
{
	return [self hitTest:point withEvent:event];
}

- (UIView*)dtx_visTest:(CGPoint)point withEvent:(UIEvent *)event lookingFor:(UIView*)lookingFor limitTestedRegion:(BOOL)limitTestedRegion regionLimit:(CGSize)regionLimit
{
	if(self.isHiddenOrHasHiddenAncestor == YES)
	{
		return nil;
	}

	if(self.alpha == 0.0)
	{
		return nil;
	}
	
	if(self.clipsToBounds == YES && [self pointInside:point withEvent:event] == NO)
	{
		return nil;
	}

	if(self == lookingFor)
	{
		//Take a shortcut here, because we found ourselves
		return self;
	}

	UIView* rv;

	//Front-most views get priority
	for (__kindof UIView * _Nonnull obj in self.subviews.reverseObjectEnumerator) {
		CGPoint localPoint = [self convertPoint:point toView:obj];

		UIView* candidate = [obj dtx_visTest:localPoint withEvent:event lookingFor:lookingFor limitTestedRegion:limitTestedRegion regionLimit:regionLimit];

		if(candidate == nil)
		{
			continue;
		}

		rv = candidate;
		break;
	}
	
	if(rv == nil && CGRectGetWidth(self.bounds) > 0 && CGRectGetHeight(self.bounds) > 0)
	{
		CGRect testedRegion;
		if(limitTestedRegion)
		{
			testedRegion = [self _dtx_testRegionAroundPoint:point viewSize:lookingFor.bounds.size hardLimitSize:regionLimit];
		}
		else
		{
			testedRegion = [self convertRect:lookingFor.bounds fromView:lookingFor];
		}
		
		UIImage* img = [self _dtx_imageInTestedRegion:testedRegion];
		
		
		
		NSUInteger total;
		NSUInteger visible = [img dtx_numberOfVisiblePixelsWithThreshold:DetoxPolicy.activePolicy.visibilityPixelAlphaThreshold totalPixels:&total];
		
		if([self _dtx_isTestedRegionObscured:testedRegion byView:self withVisiblePixels:visible totalPixels:total ofView:lookingFor])
		{
#if DEBUG
//			[self.window dtx_saveSnapshotToDesktopWithPoint:[self.window convertPoint:point fromView:self] rects:@[@([self.window convertRect:testedRegion fromView:self]), @([self.window convertRect:self.bounds fromView:self])]];
//			[img dtx_saveToDesktop];
#endif
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

- (BOOL)dtx_isVisibleAtPoint:(CGPoint)point
{
	return [self dtx_isVisibleAtPoint:point error:NULL];
}

- (BOOL)dtx_isVisibleAtPoint:(CGPoint)point error:(NSError* __strong *)error
{
	return [self _dtx_someTestAtPoint:point testSelector:@selector(dtx_visTest:withEvent:lookingFor:limitTestedRegion:regionLimit:) limitTestedRegion:NO regionLimit:CGSizeZero error:error];
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
	return [self _dtx_someTestAtPoint:point testSelector:@selector(dtx_visTest:withEvent:lookingFor:limitTestedRegion:regionLimit:) limitTestedRegion:YES regionLimit:CGSizeMake(1, 1) error:error];
}

//- (BOOL)_dtx_isActuallyHittableAtPoint:(CGPoint)point error:(NSError* __strong *)error
//{
//	if([self isKindOfClass:NSClassFromString(@"UISegmentLabel")] || [self isKindOfClass:NSClassFromString(@"UISegment")])
//	{
//		UISegmentedControl* segmentControl = (id)self;
//		while(segmentControl != nil && [segmentControl isKindOfClass:UISegmentedControl.class] == NO)
//		{
//			segmentControl = (id)segmentControl.superview;
//		}
//
//		return [segmentControl dtx_isHittableAtPoint:[segmentControl convertPoint:point fromView:self] error:error];
//	}
//
//	if([self isKindOfClass:NSClassFromString(@"UIButtonLabel")])
//	{
//		UIView* button = (id)self;
//		while(button != nil && [button isKindOfClass:UIButton.class] == NO)
//		{
//			button = (id)button.superview;
//		}
//
//		if([button isKindOfClass:NSClassFromString(@"_UIModernBarButton")] && button.userInteractionEnabled == NO && [button.superview isKindOfClass:NSClassFromString(@"_UIButtonBarButton")])
//		{
//			button = (id)button.superview;
//		}
//
//		return [button dtx_isHittableAtPoint:[button convertPoint:point fromView:self] error:error];
//	}
//
//	if([self isKindOfClass:UILabel.class] && [self.dtx_containingViewController isKindOfClass:UIAlertController.class])
//	{
//		return YES;
//	}
//
//	return [self _dtx_someTestAtPoint:point testSelector:@selector(dtx_hitTest:withEvent:lookingFor:) error:error];
//}

#define APPLY_PREFIX(...) [NSString stringWithFormat:@"%@ %@", prefix, __VA_ARGS__]

- (BOOL)_dtx_someTestAtPoint:(CGPoint)point testSelector:(SEL)selector limitTestedRegion:(BOOL)limitTestedRegion regionLimit:(CGSize)regionLimit error:(NSError* __strong *)error
{
	BOOL isHit = (selector == @selector(dtx_hitTest:withEvent:lookingFor:));
	NSString* prefix = [NSString stringWithFormat:@"View “%@” is not %@ at point “%@”;", self.dtx_shortDescription, isHit ? @"hittable" : @"visible", DTXPointToString(point)];
	
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
	
	//Point in window coordinate space
	UIScreen* screen = windowToUse.screen;
	CGPoint screenActivationPoint = [self convertPoint:point toCoordinateSpace:screen.coordinateSpace];
	CGRect windowTestedRegion;
	
	if(limitTestedRegion == YES)
	{
		windowTestedRegion = [windowToUse convertRect:[self _dtx_testRegionAroundPoint:point viewSize:self.bounds.size hardLimitSize:regionLimit] fromView:self];
	}
	else
	{
		windowTestedRegion = [windowToUse convertRect:self.bounds fromView:self];
	}
	
	if(isHit && (CGRectGetWidth(self.dtx_safeAreaBounds) == 0 || CGRectGetHeight(self.dtx_safeAreaBounds) == 0))
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"View safe area bounds are empty")}]);
		
		return NO;
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"View is hidden or has hidden ancestor")}]);
		
		return NO;
	}
	
	__block BOOL rv = NO;
	
	if(isHit && self.userInteractionEnabled == NO)
	{
		_DTXPopulateError([NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX(@"View has user interaction disabled (userInteractionEnabled == NO)")}]);
		
		return NO;
	}
	
	if([self _dtx_isTestedRegionObscured:windowTestedRegion inWindowBounds:windowToUse.bounds])
	{
		NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"View “%@” does not pass visibility threshold (%@) within window bounds", self.dtx_shortDescription, DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThresholdDescription])}];
		_DTXPopulateError(err);
		
		return NO;
	}
	
	id (*testFunc)(id, SEL, CGPoint, id, id, BOOL, CGSize) = (void*)objc_msgSend;
	
	id scene = nil;
	if(@available(iOS 13.0, *))
	{
		scene = windowToUse.windowScene;
	}
	
	[UIWindow dtx_enumerateWindowsInScene:scene usingBlock:^(UIWindow * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		if(obj.screen != screen)
		{
			//Irrelevant window, ignore
			return;
		}
		
		if([obj isKindOfClass:DTXTouchVisualizerWindow.class])
		{
			return;
		}
		
		CGPoint currentWindowActivationPoint = [screen.coordinateSpace convertPoint:screenActivationPoint toCoordinateSpace:obj.coordinateSpace];
		
		if(windowToUse != obj && isHit == NO)
		{
			CGRect testedRegion;
			if(limitTestedRegion == NO)
			{
				testedRegion = [windowToUse convertRect:self.bounds fromView:self];
			}
			else
			{
				testedRegion = [windowToUse _dtx_testRegionAroundPoint:point viewSize:windowToUse.bounds.size hardLimitSize:regionLimit];
			}
			testedRegion = [obj convertRect:testedRegion fromWindow:windowToUse];
			UIImage* windowImage = [obj _dtx_imageInTestedRegion:testedRegion];
			
			NSUInteger total;
			NSUInteger visible = [windowImage dtx_numberOfVisiblePixelsWithThreshold:DetoxPolicy.activePolicy.visibilityPixelAlphaThreshold totalPixels:&total];
			
			if([self _dtx_isTestedRegionObscured:testedRegion byView:self withVisiblePixels:visible totalPixels:total ofView:windowToUse])
			{
#if DEBUG
//				[windowImage dtx_saveToDesktop];
#endif
				
				NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"Window “%@” obscures view “%@” above visibility threshold (%@)", obj.dtx_shortDescription, self.dtx_shortDescription, DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThresholdDescription])}];
				_DTXPopulateError(err);
				
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
		
		UIView* visibleView = testFunc(obj, selector, currentWindowActivationPoint, nil, self, limitTestedRegion, regionLimit);
		
		if(windowToUse != obj && isHit == YES)
		{
			if(visibleView != nil)
			{
				NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"Another view “%@” is hittable in window “%@” at window point “%@”", visibleView.dtx_shortDescription, obj.dtx_shortDescription, DTXPointToString(currentWindowActivationPoint)])}];
				_DTXPopulateError(err);
				
				//We've hit a view in another window
				rv = NO;
				*stop = YES;
			}
			return;
		}
		
		NSAssert(windowToUse == obj, @"Detox logic failure!");
		*stop = YES;
		
		if(visibleView == self || [visibleView isDescendantOfView:self])
		{
			rv = YES;
		}
		else
		{
			rv = NO;
//			NSString* str = isHit ? @"hittable" : @"visible";
			
			if(visibleView == nil)
			{
				NSError* err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"View “%@” not visible", self.dtx_shortDescription])}];
				_DTXPopulateError(err);
			}
			else
			{
				NSError* err;
				if(isHit)
				{
					err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"Another view “%@” is hittable at window point “%@”", visibleView.dtx_shortDescription, DTXPointToString(currentWindowActivationPoint)])}];
				}
				else
				{
					err = [NSError errorWithDomain:@"DetoxErrorDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: APPLY_PREFIX([NSString stringWithFormat:@"View “%@” does not pass visibility threshold (%@)", visibleView.dtx_shortDescription, DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThresholdDescription])}];
				}
				_DTXPopulateError(err);
			}
			
			return;
		}
	}];
	
	return rv;
}

- (CGRect)_dtx_testRegionAroundPoint:(CGPoint)point viewSize:(CGSize)viewSize hardLimitSize:(CGSize)hardLimitSize
{
	static const CGFloat maxDimension = 44;
	
	return [self _dtx_testRegionAroundPoint:point maxDimension:maxDimension viewSize:viewSize hardLimitSize:hardLimitSize];
}

- (CGRect)_dtx_testRegionAroundPoint:(CGPoint)point maxDimension:(CGFloat)maxDimension viewSize:(CGSize)viewSize hardLimitSize:(CGSize)hardLimitSize
{
	CGSize maxSize = CGSizeMake(MIN(viewSize.width, hardLimitSize.width), MIN(viewSize.height, hardLimitSize.height));
	
	CGFloat width = floor(MIN(maxDimension, maxSize.width));
	CGFloat height = floor(MIN(maxDimension, maxSize.height));
	CGFloat x = point.x - width / 2.0;
	CGFloat y = point.y - height / 2.0;
	
	return CGRectMake(x, y, width, height);
}

- (UIImage*)_dtx_imageInTestedRegion:(CGRect)testedRegion
{
//	UIGraphicsBeginImageContext(testedRegion.size);
//	CGContextTranslateCTM(UIGraphicsGetCurrentContext(), -testedRegion.origin.x, -testedRegion.origin.y);
//	[self drawViewHierarchyInRect:self.bounds afterScreenUpdates:NO];
//	UIImage* image = UIGraphicsGetImageFromCurrentImageContext();
//	UIGraphicsEndImageContext();
	
	CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
	if (colorSpace == NULL)
	{
		return nil;
	}
	dtx_defer {
		CGColorSpaceRelease(colorSpace);
	};

	CGContextRef context = CGBitmapContextCreate(NULL, testedRegion.size.width, testedRegion.size.height, 8, testedRegion.size.width * 4, colorSpace, (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
	if(context == NULL)
	{
		return nil;
	}
	dtx_defer {
		CGContextRelease(context);
	};

	CGContextTranslateCTM(context, -testedRegion.origin.x, -testedRegion.origin.y);
	[self.layer.presentationLayer renderInContext:context];

	CGImageRef imageRef = CGBitmapContextCreateImage(context);
	dtx_defer {
		CGImageRelease(imageRef);
	};

	UIImage* image = [UIImage imageWithCGImage:imageRef];
	
	return image;
}

- (BOOL)_dtx_isTestedRegionObscured:(CGRect)testedRegion byView:(UIView*)view withVisiblePixels:(NSUInteger)visible totalPixels:(NSUInteger)total ofView:(UIView*)lookingFor
{
	return (visible / (double)total) < DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThreshold;
}

- (BOOL)_dtx_isTestedRegionObscured:(CGRect)testedRegion inWindowBounds:(CGRect)windowBounds
{
	CGRect intersection = CGRectIntersection(windowBounds, testedRegion);
	return (intersection.size.width * intersection.size.height) / (testedRegion.size.width * testedRegion.size.height) < DetoxPolicy.activePolicy.visibilityVisiblePixelRatioThreshold;
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
