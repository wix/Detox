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
#import "DTXAppleInternals.h"
#import "DetoxPolicy.h"

@import ObjectiveC;

@interface UIScrollView ()

- (void)_scrollViewWillEndDraggingWithDeceleration:(BOOL)arg1;

@end

@interface UIScrollView (DetoxScrolling)

- (BOOL)_dtx_scrollViewWillEndDraggingWithDeceleration:(BOOL)arg1;
@property (nonatomic, assign, setter=dtx_setDisableDecelerationForScroll:) BOOL dtx_disableDecelerationForScroll;

@end

DTX_DIRECT_MEMBERS
@implementation UIScrollView (DetoxScrolling)

+ (void)load
{
	NSError* error;
	DTXSwizzleMethod(UIScrollView.class, @selector(_scrollViewWillEndDraggingWithDeceleration:), @selector(_dtx_scrollViewWillEndDraggingWithDeceleration:), &error);
}

- (void)dtx_setDisableDecelerationForScroll:(BOOL)dtx_disableDecelerationForScroll
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
[self setContentOffset:pointMakeMacro(target) animated:YES]; \
[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:[[self valueForKeyPath:@"animation.duration"] doubleValue] + 0.05]];

- (void)dtx_scrollToEdge:(UIRectEdge)edge
{
	CGPoint normalizedEdge;
	switch (edge) {
		case UIRectEdgeTop:
			normalizedEdge = CGPointMake(0, -1);
			break;
		case UIRectEdgeBottom:
			normalizedEdge = CGPointMake(0, 1);
			break;
		case UIRectEdgeLeft:
			normalizedEdge = CGPointMake(-1, 0);
			break;
		case UIRectEdgeRight:
			normalizedEdge = CGPointMake(1, 0);
			break;
		default:
			DTXAssert(NO, @"Incorect edge provided.");
			return;
	}
	
	[self _dtx_scrollToNormalizedEdge:normalizedEdge];
}

- (void)_dtx_scrollToNormalizedEdge:(CGPoint)edge
{
//	if(edge.x != 0)
//	{
//		DTX_SCROLL_TO_EDGE(x, left, right, width, DTXCGMakePointX);
//	}
//	else if(edge.y != 0)
//	{
//		DTX_SCROLL_TO_EDGE(y, top, bottom, height, DTXCGMakePointY);
//	}
	
	[self _dtx_scrollWithOffset:CGPointMake(- edge.x * CGFLOAT_MAX, - edge.y * CGFLOAT_MAX) normalizedStartingPoint:CGPointMake(NAN, NAN) strict:NO];
}

DTX_ALWAYS_INLINE
static NSString* _DTXScrollDirectionDescriptionWithOffset(CGPoint offset)
{
	
	//	return [NSString stringWithFormat:@"%@ for %@ points", offset.x < 0 ? @"right" : offset.x > 0 ? @"left" : offset.y < 0 ? @"down" : @"up", @(MAX(fabs(offset.x), fabs(offset.y)))];
	
	return offset.x < 0 ? @"right" : offset.x > 0 ? @"left" : offset.y < 0 ? @"down" : @"up";
}

- (void)dtx_scrollWithOffset:(CGPoint)offset
{
	[self _dtx_scrollWithOffset:offset normalizedStartingPoint:CGPointMake(NAN, NAN) strict:YES];
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
static BOOL _DTXApplyScroll(UIScrollView* scrollView, CGPoint startPoint, CGPoint offset, CGPoint* remainingOffset)
{
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
	
	//Add several points between first two and last two so that the touch system always handles points 🤦‍♂️
	if(points.count >= 2)
	{
		CGPoint first = [points.firstObject CGPointValue];
		CGPoint second = [points[1] CGPointValue];
		const double interpolationCount = MAX(fabs(first.x - second.x), fabs(first.y - second.y));
		[points removeObjectAtIndex:0];
		for(double idx = 0.0; idx < interpolationCount; idx+=1.0)
		{
			CGFloat x = LNLinearInterpolate(second.x, first.x, (idx + 1.0) / interpolationCount);
			CGFloat y = LNLinearInterpolate(second.y, first.y, (idx + 1.0) / interpolationCount);
			[points insertObject:@(CGPointMake(x, y)) atIndex:0];
		}
	}
	
	if(points.count >= 3)
	{
		CGPoint beforeLast = [points[points.count - 2] CGPointValue];
		CGPoint last = [points.lastObject CGPointValue];
		const double interpolationCount = MAX(fabs(beforeLast.x - last.x), fabs(beforeLast.y - last.y));
		[points removeLastObject];
		for(double idx = 0.0; idx < interpolationCount; idx+=1.0)
		{
			CGFloat x = LNLinearInterpolate(beforeLast.x, last.x, (idx + 1.0) / interpolationCount);
			CGFloat y = LNLinearInterpolate(beforeLast.y, last.y, (idx + 1.0) / interpolationCount);
			[points addObject:@(CGPointMake(x, y))];
		}
	}
	
	if(points.count > 1)
	{
		__block NSUInteger consecutiveTouchPointsWithSameContentOffset = 0;
		__block BOOL didSomeScroll = NO;
		__block CGPoint prevOffset = scrollView.contentOffset;
		
		__block BOOL didFailTouches = NO;
		[DTXSyntheticEvents touchAlongPath:points relativeToWindow:scrollView.window holdDurationOnFirstTouch:0.0 holdDurationOnLastTouch:0.0 onTouchCallback:^ BOOL (UITouchPhase phase) {
			if(phase != UITouchPhaseMoved)
			{
				return YES;
			}
			
			if(CGPointEqualToPoint(scrollView.contentOffset, prevOffset))
			{
				consecutiveTouchPointsWithSameContentOffset++;
			}
			else if(scrollView._isBouncing == NO)
			{
				didSomeScroll |= YES;
			}
			
			prevOffset = scrollView.contentOffset;
			
			if(scrollView.bounces && scrollView._isBouncing)
			{
				if(didSomeScroll == NO)
				{
					didFailTouches = YES;
				}
				return NO;
			}
			
			if(consecutiveTouchPointsWithSameContentOffset >
			   DetoxPolicy.consecutiveTouchPointsWithSameContentOffsetThreshold)
			{
				if(didSomeScroll == NO)
				{
					didFailTouches = YES;
				}
				return NO;
			}
			
			return YES;
		}];
		
		[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.75]];
		
		if(didFailTouches)
		{
			return NO;
		}
	}
	
	*remainingOffset = offset;
	
	return YES;
}

#define DTX_RESET_START_POINT(normalizedStartingPoint, main, other, offset) \
if(isnan(normalizedStartingPoint.other) || normalizedStartingPoint.other < 0 || normalizedStartingPoint.other > 1) \
{ \
	normalizedStartingPoint.other = 0.5; \
} \
if(isnan(normalizedStartingPoint.main) || normalizedStartingPoint.main < 0 || normalizedStartingPoint.main > 1) \
{ \
	normalizedStartingPoint.main = offset < 0 ? 0.95 : 0.05; \
}

- (void)dtx_scrollWithOffset:(CGPoint)offset normalizedStartingPoint:(CGPoint)normalizedStartingPoint
{
	[self _dtx_scrollWithOffset:offset normalizedStartingPoint:normalizedStartingPoint strict:YES];
}

- (void)_dtx_scrollWithOffset:(CGPoint)offset normalizedStartingPoint:(CGPoint)normalizedStartingPoint strict:(BOOL)strict
{
	if(offset.x == 0.0 && offset.y == 0.0)
	{
		return;
	}
	
	NSAssert(offset.x == 0.0 || offset.y == 0.0, @"Scrolling simultaneously in both directions is unsupported");
	
	self.dtx_disableDecelerationForScroll = YES;
//	BOOL oldBounces = self.bounces;
//	self.bounces = NO;
	
	CGRect safeAreaToScroll = [self.window convertRect:UIEdgeInsetsInsetRect(self.bounds, self.adjustedContentInset) fromView:self];
	
	if(offset.y != 0)
	{
		DTX_RESET_START_POINT(normalizedStartingPoint, y, x, offset.y);
	}
	else if (offset.x != 0)
	{
		DTX_RESET_START_POINT(normalizedStartingPoint, x, y, offset.x);
	}
	
	CGPoint startPoint = CGPointMake(safeAreaToScroll.origin.x + safeAreaToScroll.size.width * normalizedStartingPoint.x, safeAreaToScroll.origin.y + safeAreaToScroll.size.height * normalizedStartingPoint.y);
	
	NSUInteger successfullyAppliedScrolls = 0;
	while (offset.x != 0.0 || offset.y != 0.0)
	{
		BOOL appliedScroll = _DTXApplyScroll(self, startPoint, offset, &offset);
		successfullyAppliedScrolls += (appliedScroll ? 1 : 0);
		
		if(appliedScroll == NO)
		{
			break;
		}
	}
	
	DTXViewAssert(strict == NO || successfullyAppliedScrolls > 0, self.dtx_elementDebugAttributes, @"Unable to scroll %@ in “%@”", _DTXScrollDirectionDescriptionWithOffset(offset), self.dtx_shortDescription);
	
	self.dtx_disableDecelerationForScroll = NO;
//	self.bounces = oldBounces;
}

@end
