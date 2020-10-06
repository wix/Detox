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


static void (*__orig_VKMapView_renderInContext)(id self, SEL _cmd, CGContextRef ctx);
+ (void)_dtx_applyDrawingFixes
{
	Class cls = NSClassFromString(@"VKMapView");
	if(cls != nil)
	{
		Method m = class_getInstanceMethod(cls, @selector(renderInContext:));
		__orig_VKMapView_renderInContext = (void*)method_getImplementation(m);
		method_setImplementation(m, (void*)_dtx_map_renderInContext);
	}
}

+ (void)_dtx_restoreDrawingDefaults
{
	Class cls = NSClassFromString(@"VKMapView");
	if(cls != nil)
	{
		Method m = class_getInstanceMethod(cls, @selector(renderInContext:));
		__orig_VKMapView_renderInContext = (void*)method_getImplementation(m);
		method_setImplementation(m, (void*)__orig_VKMapView_renderInContext);
	}
}

+ (void)load
{
	@autoreleasepool
	{
		Method m = class_getInstanceMethod(CALayer.class, @selector(renderInContext:));
		class_addMethod(NSClassFromString(@"CABackdropLayer"), method_getName(m), (IMP)_dtx_backdrop_renderInContext, method_getTypeEncoding(m));
	}
}

static void _dtx_map_renderInContext(CALayer* self, SEL _sel, CGContextRef ctx)
{
	CGContextSaveGState(ctx);
	CGContextBeginTransparencyLayer(ctx, nil);
	CGContextSetAlpha(ctx, self.opacity);
	if (@available(iOS 13.0, *)) {
		[[UIColor colorWithDynamicProvider:^UIColor * _Nonnull(UITraitCollection * _Nonnull traitCollection) {
			if(traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark)
			{
				return [UIColor colorWithRed:44.0 / 255.0 green:45.0 / 255.0 blue:47.0 / 255.0 alpha:1.0];
			}
			else
			{
				return [UIColor colorWithRed:250.0 / 255.0 green:245.0 / 255.0 blue:237.0 / 255.0 alpha:1.0];
			}
		}] setFill];
	} else {
		[UIColor.whiteColor setFill];
	}
	CGContextFillRect(ctx, self.bounds);
	CGContextEndTransparencyLayer(ctx);
	CGContextRestoreGState(ctx);
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

DTX_DIRECT_MEMBERS
@implementation UIView (Drawing)

- (void)dtx_drawViewHierarchyUpToSubview:(UIView*)subview inRect:(CGRect)rect afterScreenUpdates:(BOOL)afterUpdates
{
	[CALayer _dtx_applyDrawingFixes];
	
	[self _dtx_drawViewHierarchyUpToSubview:subview rootView:self inRect:rect afterScreenUpdates:afterUpdates];
	
	[CALayer _dtx_restoreDrawingDefaults];
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

	
