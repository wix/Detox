//
//  UIView+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/29/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "UIView+DTXSpy.h"
#import "DTXOrigDispatch.h"
#import "DTXUISyncResource.h"

@import ObjectiveC;

@implementation UIView (DTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		NSError* error;
		
		DTXSwizzleClassMethod(self, @selector(animateWithDuration:delay:options:animations:completion:), @selector(__detox_sync_animateWithDuration:delay:options:animations:completion:), &error);
		DTXSwizzleClassMethod(self, @selector(animateWithDuration:animations:completion:), @selector(__detox_sync_animateWithDuration:animations:completion:), &error);
		DTXSwizzleClassMethod(self, @selector(animateWithDuration:animations:), @selector(__detox_sync_animateWithDuration:animations:), &error);
		DTXSwizzleClassMethod(self, @selector(animateWithDuration:delay:usingSpringWithDamping:initialSpringVelocity:options:animations:completion:), @selector(__detox_sync_animateWithDuration:delay:usingSpringWithDamping:initialSpringVelocity:options:animations:completion:), &error);
		DTXSwizzleClassMethod(self, @selector(transitionFromView:toView:duration:options:completion:), @selector(__detox_sync_transitionFromView:toView:duration:options:completion:), &error);
		DTXSwizzleClassMethod(self, @selector(transitionWithView:duration:options:animations:completion:), @selector(__detox_sync_transitionWithView:duration:options:animations:completion:), &error);
		DTXSwizzleClassMethod(self, @selector(animateKeyframesWithDuration:delay:options:animations:completion:), @selector(__detox_sync_animateKeyframesWithDuration:delay:options:animations:completion:), &error);
		
		DTXSwizzleMethod(self, @selector(setNeedsLayout), @selector(__detox_sync_setNeedsLayout), &error);
		DTXSwizzleMethod(self, @selector(setNeedsDisplay), @selector(__detox_sync_setNeedsDisplay), &error);
		DTXSwizzleMethod(self, @selector(setNeedsDisplayInRect:), @selector(__detox_sync_setNeedsDisplayInRect:), &error);
	}
}

+ (dispatch_block_t)_failSafeTrackAnimationWithDuration:(NSTimeInterval)duration delay:(NSTimeInterval)delay completion:(id)completion
{
	if(completion == nil)
	{
		return ^{};
	}
	
	NSString* identifier = [DTXUISyncResource.sharedInstance trackViewAnimationWithDuration:duration delay:delay];
	
	__block BOOL alreadyUntracked = NO;
	dispatch_block_t failSafeUntrack = ^ {
		if(alreadyUntracked == NO)
		{
			[DTXUISyncResource.sharedInstance untrackViewAnimation:identifier];
			alreadyUntracked = YES;
		}
	};
	
	//Failsafe, just in case.
	__detox_sync_orig_dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)((delay + duration + 0.1) * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
		failSafeUntrack();
	});
	
	return failSafeUntrack;
}

+ (void)__detox_sync_animateWithDuration:(NSTimeInterval)duration delay:(NSTimeInterval)delay options:(UIViewAnimationOptions)options animations:(void (^)(void))animations completion:(void (^ __nullable)(BOOL finished))completion
{
	dispatch_block_t failSafeUntrack = [self _failSafeTrackAnimationWithDuration:duration delay:delay completion:completion];
	
	[self __detox_sync_animateWithDuration:duration delay:delay options:options animations:animations completion:^(BOOL finished) {
		if(completion)
		{
			completion(finished);
		}

		failSafeUntrack();
	}];
}

+ (void)__detox_sync_animateWithDuration:(NSTimeInterval)duration animations:(void (^)(void))animations completion:(void (^)(BOOL))completion
{
	[self animateWithDuration:duration delay:0.0 options:0 animations:animations completion:completion];
}

+ (void)__detox_sync_animateWithDuration:(NSTimeInterval)duration animations:(void (^)(void))animations
{
	[self animateWithDuration:duration delay:0.0 options:0 animations:animations completion:nil];
}

+ (void)__detox_sync_animateWithDuration:(NSTimeInterval)duration delay:(NSTimeInterval)delay usingSpringWithDamping:(CGFloat)dampingRatio initialSpringVelocity:(CGFloat)velocity options:(UIViewAnimationOptions)options animations:(void (^)(void))animations completion:(void (^ __nullable)(BOOL finished))completion
{
	dispatch_block_t failSafeUntrack = [self _failSafeTrackAnimationWithDuration:duration delay:delay completion:completion];
	
	[self __detox_sync_animateWithDuration:duration delay:delay usingSpringWithDamping:dampingRatio initialSpringVelocity:velocity options:options animations:animations completion:^(BOOL finished) {
		if(completion)
		{
			completion(finished);
		}
		
		failSafeUntrack();
	}];
}

+ (void)__detox_sync_transitionFromView:(UIView *)fromView toView:(UIView *)toView duration:(NSTimeInterval)duration options:(UIViewAnimationOptions)options completion:(void (^ __nullable)(BOOL finished))completion
{
	dispatch_block_t failSafeUntrack = [self _failSafeTrackAnimationWithDuration:duration delay:0.0 completion:completion];
	
	[self __detox_sync_transitionFromView:fromView toView:toView duration:duration options:options completion:^(BOOL finished) {
		if(completion)
		{
			completion(finished);
		}
		
		failSafeUntrack();
	}];
}

+ (void)__detox_sync_transitionWithView:(UIView *)view duration:(NSTimeInterval)duration options:(UIViewAnimationOptions)options animations:(void (^ __nullable)(void))animations completion:(void (^ __nullable)(BOOL finished))completion
{
	dispatch_block_t failSafeUntrack = [self _failSafeTrackAnimationWithDuration:duration delay:0.0 completion:completion];
	
	[self __detox_sync_transitionWithView:view duration:duration options:options animations:animations completion:^(BOOL finished) {
		if(completion)
		{
			completion(finished);
		}
		
		failSafeUntrack();
	}];
}

+ (void)__detox_sync_animateKeyframesWithDuration:(NSTimeInterval)duration delay:(NSTimeInterval)delay options:(UIViewKeyframeAnimationOptions)options animations:(void (^)(void))animations completion:(void (^ __nullable)(BOOL finished))completion
{
	dispatch_block_t failSafeUntrack = [self _failSafeTrackAnimationWithDuration:duration delay:delay completion:completion];
	
	[self __detox_sync_animateKeyframesWithDuration:duration delay:delay options:options animations:animations completion:^(BOOL finished) {
		if(completion)
		{
			completion(finished);
		}
		
		failSafeUntrack();
	}];
}

/* No need to swizzle, calls public API: */

//+ (void)performSystemAnimation:(UISystemAnimation)animation onViews:(NSArray<__kindof UIView *> *)views options:(UIViewAnimationOptions)options animations:(void (^ __nullable)(void))parallelAnimations completion:(void (^ __nullable)(BOOL finished))completion API_AVAILABLE(ios(7.0));

- (NSString*)__detox_sync_safeDescription
{
	if([self isKindOfClass:UISearchBar.class])
	{
		//Under iOS 14, UISearchBar gets triggered if -text is called before its initial layout 🤦‍♂️🤦‍♂️🤦‍♂️
		return [NSString stringWithFormat:@"<%@: %p; frame = (%@ %@; %@ %@); text = <redacted>; gestureRecognizers = <NSArray: %p>; layer = <CALayer: %p>>", NSStringFromClass(self.class), self, @(self.frame.origin.x), @(self.frame.origin.y), @(self.frame.size.width), @(self.frame.size.height), self.gestureRecognizers, self.layer];
	}

	return [self description];
}

- (void)__detox_sync_setNeedsLayout
{
	[DTXUISyncResource.sharedInstance trackViewNeedsLayout:self];
	
	[self __detox_sync_setNeedsLayout];
}

- (void)__detox_sync_setNeedsDisplay
{
	[DTXUISyncResource.sharedInstance trackViewNeedsDisplay:self];
	
	[self __detox_sync_setNeedsDisplay];
}

- (void)__detox_sync_setNeedsDisplayInRect:(CGRect)rect
{
	[DTXUISyncResource.sharedInstance trackViewNeedsDisplay:self];

	[self __detox_sync_setNeedsDisplayInRect:rect];

}

@end
