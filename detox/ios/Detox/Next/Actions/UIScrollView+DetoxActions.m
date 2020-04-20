//
//  UIScrollView+DetoxActions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIScrollView+DetoxActions.h"

@implementation UIScrollView (DetoxActions)

- (void)dtx_scrollToNormalizedEdge:(CGPoint)edge
{
	CGFloat pixelSize = 1 / self.window.screen.nativeScale;
	
	CGRect rect = CGRectNull;
	if(edge.x != 0.0)
	{
		rect = CGRectMake(edge.x < 0 ? 0 : self.contentSize.width - pixelSize, self.contentOffset.y , pixelSize, pixelSize);
	}
	else if(edge.y != 0.0)
	{
		rect = CGRectMake(self.contentOffset.x, edge.y < 0 ? 0 : self.contentSize.height - pixelSize, pixelSize, pixelSize);
	}
	
	if(CGRectIsNull(rect) == NO)
	{
		[self scrollRectToVisible:rect animated:YES];
	}
}

- (void)dtx_scrollWithOffset:(CGPoint)offset
{
	[self dtx_scrollWithOffset:offset normalizedStartingOffset:CGPointMake(0.5, 1.0)];
}

static NSArray* _DTXPointPath(void)
{
	
}

- (void)dtx_scrollWithOffset:(CGPoint)offset normalizedStartingOffset:(CGPoint)normalizedStartingOffset
{
	NSAssert(offset.x == 0.0 || offset.y == 0.0, @"Scrolling in both directions is unsupported");
	
	CGRect safeAreaToScroll = UIEdgeInsetsInsetRect(self.bounds, self.adjustedContentInset);
	CGPoint startPoint = CGPointMake(safeAreaToScroll.origin.x + safeAreaToScroll.size.width * normalizedStartingOffset.x, safeAreaToScroll.origin.y + safeAreaToScroll.size.height * normalizedStartingOffset.y);
	
	
}

@end
