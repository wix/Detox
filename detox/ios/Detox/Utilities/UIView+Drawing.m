//
//  UIView+Drawing.m
//  Detox
//
//  Created by Leo Natan on 9/17/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+Drawing.h"
@import ObjectiveC;

@interface CALayer (BackdropDrawingUtils) @end
@implementation CALayer (BackdropDrawingUtils)

+ (void)load
{
	@autoreleasepool
	{
		Method m = class_getInstanceMethod(CALayer.class, @selector(renderInContext:));
		class_addMethod(NSClassFromString(@"CABackdropLayer"), method_getName(m), (IMP)_dtx_backdrop_renderInContext, method_getTypeEncoding(m));
	}
}

static void _dtx_backdrop_renderInContext(CALayer* self, SEL _sel, CGContextRef ctx)
{
	CGContextSaveGState(ctx);
	CGContextBeginTransparencyLayer(ctx, nil);
	CGContextSetAlpha(ctx, self.opacity);
	if (@available(iOS 13.0, *)) {
		[UIColor.systemBackgroundColor setFill];
	} else {
		[UIColor.whiteColor setFill];
	}
	CGContextFillRect(ctx, self.bounds);
	CGContextEndTransparencyLayer(ctx);
	CGContextRestoreGState(ctx);
}

@end

@implementation UIView (Drawing)

- (CGRect)dtx_recursiveBounds
{
	if(self.clipsToBounds == YES)
	{
		return self.bounds;
	}
	
	CGRect rv = self.bounds;
	for (UIView* subview in self.subviews) {
		rv = CGRectUnion(rv, subview.dtx_recursiveBounds);
	}
	return rv;
}

- (void)dtx_drawViewHierarchyUpToSubview:(UIView*)subview inRect:(CGRect)rect afterScreenUpdates:(BOOL)afterUpdates
{
	return [self _dtx_drawViewHierarchyUpToSubview:subview rootView:self inRect:rect afterScreenUpdates:afterUpdates];
}

CALayer* _DTXLayerForView(UIView* view, BOOL afterUpdates)
{
	return afterUpdates ? view.layer : view.layer.presentationLayer;
}

- (void)_dtx_drawViewHierarchyUpToSubview:(UIView*)subview rootView:(UIView*)rootView inRect:(CGRect)rect afterScreenUpdates:(BOOL)afterUpdates
{
	CGContextRef ctx = UIGraphicsGetCurrentContext();
	
	if(subview == self)
	{
		return;
	}
	
	if([subview isDescendantOfView:self] == NO)
	{
		[_DTXLayerForView(self, afterUpdates) renderInContext:ctx];
		
		return;
	}
	
	for (UIView* obj in self.subviews.reverseObjectEnumerator) {
		if([subview isDescendantOfView:obj] == NO)
		{
			CGContextSaveGState(ctx);
			CGRect bounds = obj.bounds;
			CGRect boundsInRootViewCoords = [rootView convertRect:bounds fromView:obj];
			CGContextTranslateCTM(ctx, boundsInRootViewCoords.origin.x, boundsInRootViewCoords.origin.y);
			[_DTXLayerForView(obj, afterUpdates) renderInContext:ctx];
			CGContextRestoreGState(ctx);
		}
		else
		{
			[obj _dtx_drawViewHierarchyUpToSubview:subview rootView:rootView inRect:obj.bounds afterScreenUpdates:afterUpdates];
			
			//Everything else is now under the view we are searching for.
			return;
		}
	}
}

@end
