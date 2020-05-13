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

#define DTXCGMakePointY(y) CGPointMake(0, y)
#define DTXCGMakePointX(x) CGPointMake(x, 0)
#define DTX_SCROLL_TO_EDGE(axis, inset, otherInset, _size, pointMakeMacro) \
CGFloat target = 0; \
if(edge.axis < 0) \
{ \
	target = (- self.adjustedContentInset.inset); \
} \
else \
{ \
	target = self.contentSize._size + self.adjustedContentInset.otherInset - self.bounds.size._size; \
} \
CGFloat delta = self.contentOffset.axis - target; \
CGPoint offset = pointMakeMacro(delta); \
if(offset.axis != 0.0 && [self _dtx_canScrollWithOffset:offset] == NO) \
{\
	/* Already at edge */ \
	return; \
}\
[self dtx_scrollWithOffset:offset];

- (void)dtx_scrollToNormalizedEdge:(CGPoint)edge
{
	if(edge.x != 0)
	{
		DTX_SCROLL_TO_EDGE(x, left, right, width, DTXCGMakePointX);
	}
	else if(edge.y != 0)
	{
		DTX_SCROLL_TO_EDGE(y, top, bottom, height, DTXCGMakePointY);
	}
}

#define DTX_CAN_SCROLL_AXIS(main, inset, otherInset, _size) \
if(offset.main > 0 && floor(self.contentOffset.main) <= - floor(self.adjustedContentInset.inset)) \
{ \
	return NO; \
} \
else if(offset.main < 0 && floor(self.contentOffset.main) >= floor(self.contentSize._size + self.adjustedContentInset.otherInset - self.bounds.size._size)) \
{ \
	return NO; \
}

- (BOOL)_dtx_canScrollWithOffset:(CGPoint)offset
{
	if(offset.x != 0)
	{
		DTX_CAN_SCROLL_AXIS(x, left, right, width);
	}
	else if(offset.y != 0)
	{
		DTX_CAN_SCROLL_AXIS(y, top, bottom, height);
	}
	
	return YES;
}

- (void)_dtx_assertCanScrollWithOffset:(CGPoint)offset
{
	DTXViewAssert([self _dtx_canScrollWithOffset:offset], self, @"Unable to perform scroll in “%@”", self.dtx_shortDescription);
}

- (void)dtx_scrollWithOffset:(CGPoint)offset
{
	[self dtx_scrollWithOffset:offset normalizedStartingPoint:CGPointMake(NAN, NAN)];
}

#define DTX_CREATE_SCROLL_POINTS(window, points, startPoint, offset, main, windowSafeAreaMain, windowMoundsMain) \
offset.main += (fabs(offset.main) / offset.main * 10); \
const CGFloat d = fabs(offset.main) / offset.main * UIApplication.dtx_panVelocity; \
while (offset.main != 0 && startPoint.main > window.safeAreaInsets.windowSafeAreaMain && startPoint.main < window.bounds.size.windowMoundsMain) { \
	CGFloat localD = offset.main < 0 ? MAX(d, offset.main) : MIN(d, offset.main); \
	startPoint.main += localD; \
	offset.main -= localD; \
	[points addObject:@(startPoint)]; \
}

DTX_ALWAYS_INLINE
static void _DTXApplyScroll(UIScrollView* scrollView, CGPoint startPoint, CGPoint offset, CGPoint* remainingOffset)
{
	if([scrollView _dtx_canScrollWithOffset:offset] == NO)
	{
		*remainingOffset = CGPointZero;
		return;
	}
	
	NSMutableArray<NSValue*>* points = [NSMutableArray new];
	
	[points addObject:@(startPoint)];
	
	if(offset.x != 0)
	{
		DTX_CREATE_SCROLL_POINTS(scrollView.window, points, startPoint, offset, x, left, width);
	}
	else if(offset.y != 0)
	{
		DTX_CREATE_SCROLL_POINTS(scrollView.window, points, startPoint, offset, y, top, height);
	}
	
	if(points.count > 1)
	{
		[DTXSyntheticEvents touchAlongPath:points relativeToWindow:scrollView.window holdDurationOnLastTouch:0.0];
		
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

- (void)dtx_scrollWithOffset:(CGPoint)offset normalizedStartingPoint:(CGPoint)normalizedStartingPoint
{
	if(offset.x == 0.0 && offset.y == 0.0)
	{
		return;
	}
	
	NSAssert(offset.x == 0.0 || offset.y == 0.0, @"Scrolling simultaneously in both directions is unsupported");
	[self _dtx_assertCanScrollWithOffset:offset];
	
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
		_DTXApplyScroll(self, startPoint, offset, &offset);
	}
	
	self.dtx_disableDecelerationForScroll = NO;
}

@end
