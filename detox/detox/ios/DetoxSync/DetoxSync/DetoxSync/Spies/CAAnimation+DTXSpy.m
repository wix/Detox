//
//  CAAnimation+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "CAAnimation+DTXSpy.h"
//#import "DTXSingleEventSyncResource.h"
#import "DTXUISyncResource.h"
@import ObjectiveC;

static const void* _DTXCAAnimationIsTrackingKey = &_DTXCAAnimationIsTrackingKey;

@interface _DTXCAAnimationDelegateHelper : NSObject @end
@implementation _DTXCAAnimationDelegateHelper

- (void)__detox_sync_animationDidStart:(CAAnimation *)anim
{
	[anim __detox_sync_trackAnimation];
	
	[self __detox_sync_animationDidStart:anim];
}

- (void)__detox_sync_animationDidStop:(CAAnimation *)anim finished:(BOOL)flag
{
	[self __detox_sync_animationDidStop:anim finished:flag];
	
	[anim __detox_sync_untrackAnimation];
}

@end

@interface CAAnimation ()

- (BOOL)_setCARenderAnimation:(void*)arg1 layer:(id)arg2;

@end

@implementation CAAnimation (DTXSpy)

- (BOOL)__detox_sync_isTracking
{
	return [objc_getAssociatedObject(self, _DTXCAAnimationIsTrackingKey) boolValue];
}

- (void)__detox_sync_setTracking:(BOOL)tracking
{
	objc_setAssociatedObject(self, _DTXCAAnimationIsTrackingKey, @(tracking), OBJC_ASSOCIATION_RETAIN);
}

- (void)__detox_sync_trackAnimation
{
	[self __detox_sync_untrackAnimation];
	
	[DTXUISyncResource.sharedInstance trackCAAnimation:self];
	[self __detox_sync_setTracking:YES];
}

- (void)__detox_sync_untrackAnimation
{
	if(self.__detox_sync_isTracking == YES)
	{
		[DTXUISyncResource.sharedInstance untrackCAAnimation:self];
		[self __detox_sync_setTracking:NO];
	}
}

+ (void)load
{
	@autoreleasepool
	{
		DTXSwizzleMethod(CAAnimation.class, @selector(setDelegate:), @selector(__detox_sync_setDelegate:), NULL);
	}
}

- (void)__detox_sync_prepareDelegateIfNeeded:(id<CAAnimationDelegate>)delegate
{
	Method mmm = class_getInstanceMethod(delegate.class, NSSelectorFromString(@"__detox_sync_canary"));
	if(mmm != NULL)
	{
		return;
	}
	
	NSError* error;
	
	Method m2_helper = class_getInstanceMethod(_DTXCAAnimationDelegateHelper.class, @selector(__detox_sync_animationDidStart:));
	if(class_getInstanceMethod(delegate.class, @selector(animationDidStart:)) == NULL)
	{
		class_addMethod(delegate.class, @selector(animationDidStart:), imp_implementationWithBlock(^(id _self, id anim) { }), method_getTypeEncoding(m2_helper));
	}
	class_addMethod(delegate.class, @selector(__detox_sync_animationDidStart:), method_getImplementation(m2_helper), method_getTypeEncoding(m2_helper));
	
	DTXSwizzleMethod(delegate.class, @selector(animationDidStart:), @selector(__detox_sync_animationDidStart:), &error);
	
	m2_helper = class_getInstanceMethod(_DTXCAAnimationDelegateHelper.class, @selector(__detox_sync_animationDidStop:finished:));
	if(class_getInstanceMethod(delegate.class, @selector(animationDidStop:finished:)) == NULL)
	{
		class_addMethod(delegate.class, @selector(animationDidStop:finished:), imp_implementationWithBlock(^(id _self, id anim) { }), method_getTypeEncoding(m2_helper));
	}
	class_addMethod(delegate.class, @selector(__detox_sync_animationDidStop:finished:), method_getImplementation(m2_helper), method_getTypeEncoding(m2_helper));
	
	DTXSwizzleMethod(delegate.class, @selector(animationDidStop:finished:), @selector(__detox_sync_animationDidStop:finished:), &error);
	
	class_addMethod(delegate.class, NSSelectorFromString(@"__detox_sync_canary"), imp_implementationWithBlock(^ (id _self) { }), "v8@0:4");
}

- (void)__detox_sync_setDelegate:(id<CAAnimationDelegate>)delegate
{
	[self __detox_sync_prepareDelegateIfNeeded:delegate];
	
	[self __detox_sync_setDelegate:delegate];
}

@end
