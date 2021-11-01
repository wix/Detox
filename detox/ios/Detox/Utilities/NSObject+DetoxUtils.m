//
//  NSObject+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan on 11/12/20.
//  Copyright © 2020 Wix. All rights reserved.
//

@import UIKit;
#import "DetoxPolicy.h"
#import "DTXAppleInternals.h"
#import "NSObject+DetoxUtils.h"
#import "NSObject+DontCrash.h"
#import "UISlider+DetoxUtils.h"
#import "UIWindow+DetoxUtils.h"

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

@interface NSObject ()

@property (readonly) id<UICoordinateSpace> coordinateSpace;

@end

BOOL __DTXDoulbeEqualToDouble(double a, double b)
{
	double difference = fabs(a * .00001);
	return fabs(a - b) <= difference;
}

BOOL __DTXPointEqualToPoint(CGPoint a, CGPoint b)
{
	return __DTXDoulbeEqualToDouble(floor(a.x), floor(b.x)) && __DTXDoulbeEqualToDouble(floor(a.y), floor(b.y));
}

@implementation NSObject (DetoxUtils)

@dynamic accessibilityIdentifier;
@dynamic accessibilityContainer;

- (CGPoint)dtx_convertRelativePointToViewCoordinateSpace:(CGPoint)relativePoint
{
	if([self isKindOfClass:UIView.class])
	{
		return relativePoint;
	}
	
	CGPoint screenPoint = CGPointMake(self.accessibilityFrame.origin.x + relativePoint.x, self.accessibilityFrame.origin.y + relativePoint.y);
	return [self.dtx_view.window.screen.coordinateSpace convertPoint:screenPoint toCoordinateSpace:self.dtx_view.coordinateSpace];
}

- (UIView*)dtx_view
{
	if([self isKindOfClass:UIView.class])
	{
		return (id)self;
	}
	
	return self.dtx_viewContainer;
}

- (UIView*)dtx_viewContainer
{
	if([self isKindOfClass:UIView.class])
	{
		return self.dtx_container;
	}
	else if([self respondsToSelector:@selector(accessibilityContainer)])
	{
		return [self.dtx_container dtx_view];
	}
	
	return nil;
}

- (id)dtx_container
{
	if ([self isKindOfClass:UIView.class])
	{
		return [(UIView *)self superview];
	}
	else if ([self respondsToSelector:@selector(accessibilityContainer)])
	{
		return [(UIAccessibilityElement*)self accessibilityContainer];
	}

	return nil;
}

- (CGRect)dtx_bounds
{
	if([self isKindOfClass:UIView.class])
	{
		return [(UIView*)self bounds];
	}
	
	UIView* view = self.dtx_view;
	return [view.window.screen.coordinateSpace convertRect:self.accessibilityFrame toCoordinateSpace:view.coordinateSpace];
}

- (CGRect)dtx_contentBounds
{
	return self.dtx_bounds;
}

- (CGRect)dtx_visibleBounds
{
	return self.dtx_bounds;
}

- (BOOL)dtx_isVisible {
	return [self dtx_isVisibleAtRect:self.dtx_bounds percent:nil error:NULL];
}

- (BOOL)dtx_isVisibleAtRect:(CGRect)rect percent:(nullable NSNumber *)percent
					  error:(NSError *__strong  _Nullable *)error {
	return [self.dtx_view dtx_isVisibleAtRect:rect percent:percent error:error];
}

- (void)dtx_assertVisible {
	[self dtx_assertVisibleAtRect:self.dtx_bounds percent:nil];
}

- (void)dtx_assertVisibleAtRect:(CGRect)rect percent:(NSNumber *)percent {
	[self.dtx_view dtx_assertVisibleAtRect:rect percent:percent];
}

- (BOOL)dtx_isFocused
{
	BOOL isFocused = [self.dtx_view isFocused];
	BOOL isFirstResponder = [self.dtx_view isFirstResponder];
	return isFocused || isFirstResponder;
}

- (BOOL)dtx_isHittable
{
	return YES;
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point
{
	return YES;
}

- (BOOL)dtx_isHittableAtPoint:(CGPoint)point error:(NSError* __strong * __nullable)error
{
	return YES;
}

- (void)dtx_assertHittable
{
	
}

- (void)dtx_assertHittableAtPoint:(CGPoint)point
{
	
}

- (NSString *)dtx_text
{
	id rv = [self _dtx_text];
	if(rv == nil || [rv isKindOfClass:NSString.class])
	{
		return rv;
	}
	
	if([rv isKindOfClass:NSAttributedString.class])
	{
		return [(NSAttributedString*)rv string];
	}
	
	//Unsupported
	return nil;
}

- (NSString *)dtx_placeholder
{
	id rv = [self _dtx_placeholder];
	if(rv == nil || [rv isKindOfClass:NSString.class])
	{
		return rv;
	}
	
	if([rv isKindOfClass:NSAttributedString.class])
	{
		return [(NSAttributedString*)rv string];
	}
	
	//Unsupported
	return nil;
}

- (BOOL)dtx_isEnabled
{
	return self.dtx_view.dtx_isEnabled;
}

- (void)dtx_assertEnabled
{
	return [self.dtx_view dtx_assertEnabled];
}

- (NSString *)dtx_shortDescription
{
	return self.description;
}

- (CGRect)dtx_accessibilityFrame
{
	return self.accessibilityFrame;
}

- (CGRect)dtx_safeAreaBounds
{
	return self.dtx_bounds;
}

- (CGPoint)dtx_accessibilityActivationPoint
{
	return self.accessibilityActivationPoint;
}

- (CGPoint)dtx_accessibilityActivationPointInViewCoordinateSpace
{
	UIView* view = self.dtx_view;
	return [view.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:view.coordinateSpace];
}

- (NSDictionary<NSString *,id> *)dtx_attributes
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	
	rv[@"className"] = NSStringFromClass(self.class);
	
	NSDictionary* results = [self dictionaryWithValuesForKeys:@[@"dtx_text", @"accessibilityLabel", @"accessibilityIdentifier", @"accessibilityValue", @"dtx_placeholder"]];
	[results enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
		if([obj isKindOfClass:NSNull.class])
		{
			return;
		}
		
		if([key isEqualToString:@"dtx_text"])
		{
			rv[@"text"] = obj;
		}
		else if([key isEqualToString:@"dtx_placeholder"])
		{
			rv[@"placeholder"] = obj;
		}
		else if([key isEqualToString:@"accessibilityLabel"])
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
	
	rv[@"enabled"] = @(self.dtx_isEnabled);
	
	rv[@"frame"] = DTXRectToDictionary(self.dtx_accessibilityFrame);
	rv[@"elementSafeBounds"] = DTXRectToDictionary(self.dtx_safeAreaBounds);
	
	if([self isKindOfClass:UIView.class])
	{
		UIView* view = (id)self;
		rv[@"elementFrame"] = DTXRectToDictionary(view.frame);
		rv[@"elementBounds"] = DTXRectToDictionary(view.bounds);
		rv[@"safeAreaInsets"] = DTXInsetsToDictionary(view.safeAreaInsets);
		rv[@"layer"] = view.layer.description;
	}
	else
	{
		rv[@"isAccessibilityElement"] = @(self.isAccessibilityElement);
	}
	
	CGPoint accessibilityActivationPoint = self.dtx_accessibilityActivationPoint;
	CGPoint accessibilityActivationPointInViewCoordinateSpace = self.dtx_accessibilityActivationPointInViewCoordinateSpace;
	rv[@"activationPoint"] = DTXPointToDictionary(accessibilityActivationPointInViewCoordinateSpace);
	CGRect accessibilityFrame = self.dtx_accessibilityFrame;
	rv[@"normalizedActivationPoint"] = DTXPointToDictionary(CGPointMake(CGRectGetWidth(accessibilityFrame) == 0 ? 0 : (accessibilityActivationPoint.x - CGRectGetMinX(accessibilityFrame)) / CGRectGetWidth(accessibilityFrame), CGRectGetHeight(accessibilityFrame) == 0 ? 0 : (accessibilityActivationPoint.y - CGRectGetMinY(accessibilityFrame)) / CGRectGetHeight(accessibilityFrame)));
	
	rv[@"hittable"] = @(self.dtx_isHittable);
	rv[@"visible"] = @(self.dtx_isVisible);
	
	if([self isKindOfClass:UIScrollView.class])
	{
		rv[@"contentInset"] = DTXInsetsToDictionary([(UIScrollView*)self contentInset]);
		rv[@"adjustedContentInset"] = DTXInsetsToDictionary([(UIScrollView*)self adjustedContentInset]);
		rv[@"contentOffset"] = DTXPointToDictionary([(UIScrollView*)self contentOffset]);
	}
	
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

+ (NSDictionary<NSString*, id> *)dtx_genericElementDebugAttributes
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	
	rv[@"viewHierarchy"] = [[UIWindow dtx_keyWindowScene] dtx_recursiveDescription];
	
	NSMutableArray* windowDescriptions = [NSMutableArray new];
	
	UIWindowScene* scene = UIWindow.dtx_keyWindow.windowScene;	
	auto windows = [UIWindow dtx_allWindowsForScene:scene];
	[windows enumerateObjectsUsingBlock:^(UIWindow * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		[windowDescriptions addObject:[obj dtx_shortDescription]];
	}];
	
	rv[@"windows"] = windowDescriptions;
	
	return rv;
}

- (NSDictionary<NSString *,id> *)dtx_elementDebugAttributes
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	[rv addEntriesFromDictionary:NSObject.dtx_genericElementDebugAttributes];
	
	rv[@"elementAttributes"] = [self dtx_attributes];
	rv[@"viewDescription"] = self.description;
	
	return rv;
}


@end
