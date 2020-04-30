//
//  UIScrollView+DetoxActions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIScrollView+DetoxActions.h"
#import "UIApplication+DTXAdditions.h"
#import "DTXSyntheticEvents.h"
#import "UIView+DetoxUtils.h"

@import ObjectiveC;

@interface UIScrollView ()

- (void)_scrollViewWillEndDraggingWithDeceleration:(BOOL)arg1;

@end

@interface UIScrollView (DetoxScrolling)

@property (nonatomic, assign) BOOL dtx_disableDecelerationForScroll;

@end

@implementation UIScrollView (DetoxScrolling)

+ (void)load
{
	Method m1 = class_getInstanceMethod(UIScrollView.class, @selector(_scrollViewWillEndDraggingWithDeceleration:));
	Method m2 = class_getInstanceMethod(UIScrollView.class, @selector(_dtx_scrollViewWillEndDraggingWithDeceleration:));
	method_exchangeImplementations(m1, m2);
}

- (void)setDtx_disableDecelerationForScroll:(BOOL)dtx_disableDecelerationForScroll
{
	objc_setAssociatedObject(self, "dtx_disableDecelerationForScroll", @(dtx_disableDecelerationForScroll), OBJC_ASSOCIATION_RETAIN);
}

- (BOOL)dtx_disableDecelerationForScroll
{
	return [objc_getAssociatedObject(self, "dtx_disableDecelerationForScroll") boolValue];
}

- (BOOL)_dtx_scrollViewWillEndDraggingWithDeceleration:(BOOL)arg1
{
	BOOL deceleration = arg1;
	if(self.dtx_disableDecelerationForScroll == YES &&
	   //Disallow deceleration only in cases where overscroll was not performed.
	   self.contentOffset.y >= (-self.adjustedContentInset.top) &&
	   self.contentOffset.y <= self.contentSize.height - self.bounds.size.height + self.adjustedContentInset.bottom &&
	   self.contentOffset.x >= (-self.adjustedContentInset.left) &&
	   self.contentOffset.x <= self.contentSize.width - self.bounds.size.width + self.adjustedContentInset.right
	   )
	{
		deceleration = NO;
	}
	
	return [self _dtx_scrollViewWillEndDraggingWithDeceleration:deceleration];
}

@end

@implementation UIScrollView (DetoxActions)

- (void)dtx_scrollToNormalizedEdge:(CGPoint)edge
{
	
	
//	[self dtx_assertVisible];
//
//	CGFloat pixelSize = 1 / self.window.screen.nativeScale;
//
//	CGRect rect = CGRectNull;
//	if(edge.x != 0.0)
//	{
//		rect = CGRectMake(edge.x < 0 ? 0 : self.contentSize.width - pixelSize, self.contentOffset.y , pixelSize, pixelSize);
//	}
//	else if(edge.y != 0.0)
//	{
//		rect = CGRectMake(self.contentOffset.x, edge.y < 0 ? 0 : self.contentSize.height - pixelSize, pixelSize, pixelSize);
//	}
//
//	if(CGRectIsNull(rect) == NO)
//	{
//		[self scrollRectToVisible:rect animated:YES];
//	}
}

- (void)dtx_scrollWithOffset:(CGPoint)offset
{
	[self dtx_scrollWithOffset:offset normalizedStartingPoint:CGPointMake(NAN, NAN)];
}

#define DTX_CREATE_SCROLL_POINTS(points, startPoint, offset, main, windowSafeAreaMain, windowMoundsMain) \
offset.main += (fabs(offset.main) / offset.main * 10); \
const CGFloat d = fabs(offset.main) / offset.main * UIApplication.dtx_panVelocity; \
while (offset.main != 0 && startPoint.main > window.safeAreaInsets.windowSafeAreaMain && startPoint.main < window.bounds.size.windowMoundsMain) { \
	CGFloat localD = offset.main < 0 ? MAX(d, offset.main) : MIN(d, offset.main); \
	startPoint.main += localD; \
	offset.main -= localD; \
	[points addObject:@(startPoint)]; \
}

__attribute__((always_inline))
static inline void _DTXApplyScroll(UIWindow* window, CGPoint startPoint, CGPoint offset, CGPoint* remainingOffset)
{
	NSMutableArray<NSValue*>* points = [NSMutableArray new];
	
	[points addObject:@(startPoint)];
	
	if(offset.x != 0)
	{
		DTX_CREATE_SCROLL_POINTS(points, startPoint, offset, x, left, width);
	}
	else if(offset.y != 0)
	{
		DTX_CREATE_SCROLL_POINTS(points, startPoint, offset, y, top, height);
	}
	
	if(points.count > 1)
	{
		[DTXSyntheticEvents touchAlongPath:points relativeToWindow:window holdDurationOnLastTouch:0.0];
		
		[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.7]];
	}
	
	*remainingOffset = offset;
}

#define DTX_RESET_START_POINT(normalizedStartingPoint, main, other, offset) \
if(isnan(normalizedStartingPoint.other) || normalizedStartingPoint.other < 0 || normalizedStartingPoint.other > 1) \
{ \
	normalizedStartingPoint.other = 0.5; \
} \
if(isnan(normalizedStartingPoint.main) || normalizedStartingPoint.main < 0 || normalizedStartingPoint.main > 1) \
{ \
	normalizedStartingPoint.main = offset < 0 ? 0.99 : 0.01; \
}

- (void)dtx_assertCanScrollWithOffset:(CGPoint)offset
{
	
}

- (void)dtx_scrollWithOffset:(CGPoint)offset normalizedStartingPoint:(CGPoint)normalizedStartingPoint
{
	//TODO: Check if scroll view is scrollable with provided offset
	
	NSAssert(offset.x == 0.0 || offset.y == 0.0, @"Scrolling simultaneously in both directions is unsupported");
	[self dtx_assertCanScrollWithOffset:offset];
	
	self.dtx_disableDecelerationForScroll = YES;
	
	CGRect safeAreaToScroll = UIEdgeInsetsInsetRect(self.bounds, self.adjustedContentInset);
	
	if(offset.y != 0)
	{
		DTX_RESET_START_POINT(normalizedStartingPoint, y, x, offset.y);
	}
	else if (offset.x != 0)
	{
		DTX_RESET_START_POINT(normalizedStartingPoint, x, y, offset.x);
	}
	
	CGPoint startPoint = CGPointMake(safeAreaToScroll.origin.x + safeAreaToScroll.size.width * normalizedStartingPoint.x, safeAreaToScroll.origin.y + safeAreaToScroll.size.height * normalizedStartingPoint.y);
	
	[self dtx_assertHittableAtPoint:startPoint];
	
	startPoint = [self.window convertPoint:startPoint fromView:self];
	
	while (offset.x != 0.0 || offset.y != 0.0)
	{
		_DTXApplyScroll(self.window, startPoint, offset, &offset);
	}
	
	self.dtx_disableDecelerationForScroll = NO;
}

@end
