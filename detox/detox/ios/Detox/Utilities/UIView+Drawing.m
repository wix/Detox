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
- (void)_renderBorderInContext:(struct CGContext *)arg1;

@end

@interface CALayer (BackdropDrawingUtils) @end
@implementation CALayer (BackdropDrawingUtils)

static BOOL __currentlyDrawing = NO;
static BOOL __subviewFound = NO;
static UIView* __subview = nil;

static void (*__orig_VKMapView_renderInContext)(id self, SEL _cmd, CGContextRef ctx);
+ (void)_dtx_applyDrawingFixes
{
	[CALayer _fixupRenderingOnce];
	
	__currentlyDrawing = YES;
	__subviewFound = NO;
	
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
	
	__currentlyDrawing = NO;
}

+ (void)load
{
	@autoreleasepool
	{
		Method m = class_getInstanceMethod(CALayer.class, @selector(renderInContext:));
		class_addMethod(NSClassFromString(@"CABackdropLayer"), method_getName(m), (IMP)_dtx_backdrop_renderInContext, method_getTypeEncoding(m));
	}
}

+ (void)_fixupRenderingOnce
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		//Do all this to support custom layer classes thay may implement their own renderInContext: and co.
		
		Class* classes = NULL;
		int numClasses = objc_getClassList(NULL, 0);
		if (numClasses > 0)
		{
			classes = (Class*)malloc(sizeof(Class) * numClasses);
			numClasses = objc_getClassList(classes, numClasses);

			for (int i = 0; i < numClasses; i++)
			{
				Class superClass = classes[i];
				while(superClass && superClass != CALayer.class)
				{
					superClass = class_getSuperclass(superClass);
				}

				if (superClass == nil)
				{
					continue;
				}

				unsigned int numMethods = 0;
				Method* methods = class_copyMethodList(classes[i], &numMethods);
				
				for(unsigned int j = 0; j < numMethods; j++)
				{
					Method m = methods[j];
					if(sel_isEqual(method_getName(m), @selector(renderInContext:)))
					{
						void (*__orig_CALayer_renderInContext)(id self, SEL _cmd, CGContextRef ctx) = (void*)method_getImplementation(m);
						method_setImplementation(m, imp_implementationWithBlock(^(CALayer* self, CGContextRef ctx) {
							SEL _cmd = @selector(renderInContext:);
							
							if(__currentlyDrawing == NO)
							{
								__orig_CALayer_renderInContext(self, _cmd, ctx);
								return;
							}
							
							UIView* delegate = (self.delegate != nil && [self.delegate isKindOfClass:UIView.class]) ? (id)self.delegate : nil;
							
							if(__subviewFound == NO && (delegate == nil || [__subview isDescendantOfView:delegate] == NO))
							{
								//This layer tree is under the subview we are looking for.
								return;
							}
							
							if(delegate == __subview)
							{
								//This layer tree is the one we are looking for, mark as found and return.
								__subviewFound = YES;
								return;
							}
							
							if(__subviewFound == YES)
							{
								__orig_CALayer_renderInContext(self, _cmd, ctx);
								return;
							}
							
							//	[self _renderSublayersInContext:ctx];
							__orig_CALayer_renderInContext(self, _cmd, ctx);
						}));
					}
					else if(sel_isEqual(method_getName(m), @selector(_renderForegroundInContext:)) || sel_isEqual(method_getName(m), @selector(_renderBackgroundInContext:)) || sel_isEqual(method_getName(m), @selector(_renderBorderInContext:)))
					{
						SEL _cmd = method_getName(m);
						
						void (*__orig_CALayer_something)(id self, SEL _cmd, CGContextRef ctx) = (void*)method_getImplementation(m);
						method_setImplementation(m, imp_implementationWithBlock(^(CALayer* self, CGContextRef ctx) {
							if(__currentlyDrawing == NO)
							{
								__orig_CALayer_something(self, _cmd, ctx);
								return;
							}
							
							UIView* delegate = (self.delegate != nil && [self.delegate isKindOfClass:UIView.class]) ? (id)self.delegate : nil;
							
							if(__subviewFound == NO && (delegate == nil || [__subview isDescendantOfView:delegate] == NO))
							{
								//This layer tree is under the subview we are looking for.
								return;
							}
							
							if([__subview isDescendantOfView:delegate] == YES)
							{
								return;
							}
							
							__orig_CALayer_something(self, _cmd, ctx);
						}));
					}
					else if(sel_isEqual(method_getName(m), @selector(sublayers)))
					{
						NSArray* (*__orig_CALayer_sublayers)(id self, SEL _cmd) = (void*)method_getImplementation(m);
						method_setImplementation(m, imp_implementationWithBlock(^(CALayer* self, CGContextRef ctx) {
							SEL _cmd = @selector(sublayers);
							
							if(__currentlyDrawing == NO)
							{
								return __orig_CALayer_sublayers(self, _cmd);
							}
							
							NSArray* zSorted = [__orig_CALayer_sublayers(self, _cmd) sortedArrayWithOptions:NSSortStable usingComparator:^NSComparisonResult(CALayer* _Nonnull obj1, CALayer* _Nonnull obj2) {
								return [@(obj1.zPosition) compare:@(obj2.zPosition)];
							}];
							
							return zSorted;
						}));
					}
				}
				
				free(methods);
			}

			free(classes);
		}
	});
}

static void _dtx_map_renderInContext(CALayer* self, SEL _cmd, CGContextRef ctx)
{
	CGContextSaveGState(ctx);
	CGContextBeginTransparencyLayer(ctx, nil);
	CGContextSetAlpha(ctx, self.opacity);
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
	CGContextFillRect(ctx, self.bounds);
	CGContextEndTransparencyLayer(ctx);
	CGContextRestoreGState(ctx);
}

static void _dtx_backdrop_renderInContext(CALayer* self, SEL _cmd, CGContextRef ctx)
{
	CGContextSaveGState(ctx);
	CGContextBeginTransparencyLayer(ctx, nil);
	CGContextSetAlpha(ctx, self.opacity);
	[UIColor.systemBackgroundColor setFill];
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
	__subview = subview;
	
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

	
