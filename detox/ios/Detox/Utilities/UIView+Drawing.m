//
//  UIView+Drawing.m
//  Detox
//
//  Created by Leo Natan on 9/17/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+Drawing.h"
@import ObjectiveC;

@interface CALayer ()

- (void)_renderSublayersInContext:(struct CGContext *)arg1;
- (void)_renderForegroundInContext:(struct CGContext *)arg1;
- (void)_renderBackgroundInContext:(struct CGContext *)arg1;

@end

@interface CALayer (BackdropDrawingUtils) @end
@implementation CALayer (BackdropDrawingUtils)

static BOOL _hack = NO;
static BOOL _found = NO;
static UIView* _lookingFor = nil;

static NSArray* (*__orig_CALayer_sublayers)(id self, SEL _cmd);
static NSArray* _dtx_layer_sublayers(id self, SEL _cmd)
{
	if(_hack == NO)
	{
		return __orig_CALayer_sublayers(self, _cmd);
	}
	
	NSArray* zSorted = [__orig_CALayer_sublayers(self, _cmd) sortedArrayWithOptions:NSSortStable usingComparator:^NSComparisonResult(CALayer* _Nonnull obj1, CALayer* _Nonnull obj2) {
		return [@(obj1.zPosition) compare:@(obj2.zPosition)];
	}];
	
	return zSorted;
}

static void (*__orig_CALayer_renderForegroundInContext)(id self, SEL _cmd, CGContextRef ctx);
static void _dtx_layer_renderForegroundInContext(CALayer* self, SEL _cmd, CGContextRef ctx)
{
	if(_hack == NO)
	{
		__orig_CALayer_renderForegroundInContext(self, _cmd, ctx);
		return;
	}
	
	UIView* delegate = (self.delegate != nil && [self.delegate isKindOfClass:UIView.class]) ? (id)self.delegate : nil;
	
	if(_found == NO && (delegate == nil || [_lookingFor isDescendantOfView:delegate] == NO))
	{
		//This layer tree is under the subview we are looking for.
		return;
	}
	
	if([_lookingFor isDescendantOfView:delegate] == YES)
	{
		return;
	}
	
	__orig_CALayer_renderForegroundInContext(self, _cmd, ctx);
}

static void (*__orig_CALayer_renderBackgroundInContext)(id self, SEL _cmd, CGContextRef ctx);
static void _dtx_layer_renderBackgroundInContext(CALayer* self, SEL _cmd, CGContextRef ctx)
{
	if(_hack == NO)
	{
		__orig_CALayer_renderBackgroundInContext(self, _cmd, ctx);
		return;
	}
	
	UIView* delegate = (self.delegate != nil && [self.delegate isKindOfClass:UIView.class]) ? (id)self.delegate : nil;
	
	if(_found == NO && (delegate == nil || [_lookingFor isDescendantOfView:delegate] == NO))
	{
		//This layer tree is under the subview we are looking for.
		return;
	}
	
	if([_lookingFor isDescendantOfView:delegate] == YES)
	{
		return;
	}
	
	__orig_CALayer_renderBackgroundInContext(self, _cmd, ctx);
}

static void (*__orig_CALayer_renderInContext)(id self, SEL _cmd, CGContextRef ctx);
static void _dtx_layer_renderInContext(CALayer* self, SEL _cmd, CGContextRef ctx)
{
	if(_hack == NO)
	{
		__orig_CALayer_renderInContext(self, _cmd, ctx);
		return;
	}
	
	UIView* delegate = (self.delegate != nil && [self.delegate isKindOfClass:UIView.class]) ? (id)self.delegate : nil;
	
	if(_found == NO && (delegate == nil || [_lookingFor isDescendantOfView:delegate] == NO))
	{
		//This layer tree is under the subview we are looking for.
		return;
	}
	
	if(delegate == _lookingFor)
	{
		//This layer tree is the one we are looking for, mark as found and return.
		_found = YES;
		return;
	}
	
	if(_found == YES)
	{
		__orig_CALayer_renderInContext(self, _cmd, ctx);
		return;
	}
	
//	[self _renderSublayersInContext:ctx];
	__orig_CALayer_renderInContext(self, _cmd, ctx);
}

static void (*__orig_VKMapView_renderInContext)(id self, SEL _cmd, CGContextRef ctx);
+ (void)_dtx_applyDrawingFixes
{
	_hack = YES;
	_found = NO;
	
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
	
	_hack = NO;
}

+ (void)load
{
	@autoreleasepool
	{
		Method m = class_getInstanceMethod(CALayer.class, @selector(renderInContext:));
		class_addMethod(NSClassFromString(@"CABackdropLayer"), method_getName(m), (IMP)_dtx_backdrop_renderInContext, method_getTypeEncoding(m));
		
		m = class_getInstanceMethod(CALayer.class, @selector(renderInContext:));
		__orig_CALayer_renderInContext = (void*)method_getImplementation(m);
		method_setImplementation(m, (void*)_dtx_layer_renderInContext);
		
		m = class_getInstanceMethod(CALayer.class, @selector(_renderForegroundInContext:));
		__orig_CALayer_renderForegroundInContext = (void*)method_getImplementation(m);
		method_setImplementation(m, (void*)_dtx_layer_renderForegroundInContext);
		
		m = class_getInstanceMethod(CALayer.class, @selector(_renderBackgroundInContext:));
		__orig_CALayer_renderBackgroundInContext = (void*)method_getImplementation(m);
		method_setImplementation(m, (void*)_dtx_layer_renderBackgroundInContext);
		
		m = class_getInstanceMethod(CALayer.class, @selector(sublayers));
		__orig_CALayer_sublayers = (void*)method_getImplementation(m);
		method_setImplementation(m, (void*)_dtx_layer_sublayers);
	}
}

static void _dtx_map_renderInContext(CALayer* self, SEL _cmd, CGContextRef ctx)
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

static void _dtx_backdrop_renderInContext(CALayer* self, SEL _cmd, CGContextRef ctx)
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

CALayer* _DTXLayerForView(UIView* view, BOOL afterUpdates)
{
	return afterUpdates ? view.layer : view.layer.presentationLayer;
}

- (void)dtx_drawViewHierarchyUpToSubview:(UIView*)subview inRect:(CGRect)rect afterScreenUpdates:(BOOL)afterUpdates
{
	[CALayer _dtx_applyDrawingFixes];
	_lookingFor = subview;
	
	CGContextRef ctx = UIGraphicsGetCurrentContext();
	CGContextSaveGState(ctx);
	
	// Center the context around the view's anchor point
	CGContextTranslateCTM(ctx, self.center.x, self.center.y);
	// Apply the view's transform about the anchor point
	CGContextConcatCTM(ctx, self.transform);
	// Offset by the portion of the bounds left of and above the anchor point
	CGContextTranslateCTM(ctx, -self.bounds.size.width * self.layer.anchorPoint.x, -self.bounds.size.height * self.layer.anchorPoint.y);
	
	if(subview == nil)
	{
		[self drawViewHierarchyInRect:self.bounds afterScreenUpdates:afterUpdates];
	}
	else
	{
		[_DTXLayerForView(self, afterUpdates) renderInContext:ctx];
	}
	
	CGContextRestoreGState(ctx);
	[CALayer _dtx_restoreDrawingDefaults];
}

@end

	
