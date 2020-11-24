//
//  UIView+DetoxSpeedup.m
//  Detox
//
//  Created by Leo Natan on 11/24/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+DetoxSpeedup.h"

@interface NSObject ()

- (void)_setCaretBlinkAnimationEnabled:(BOOL)arg1;
- (void)setCaretBlinks:(BOOL)arg1;

@end

@interface UIScrollView ()

- (void)_hideScrollIndicators;
- (void)_hideScrollIndicator:(id)arg1 afterDelay:(NSTimeInterval)arg2 animated:(BOOL)arg3;

@end

@implementation UIView (DetoxSpeedup)

+ (void)load
{
	@autoreleasepool {
		NSError* error;
		if(@available(iOS 14.0, *))
		{
			//Under iOS 14, this is necessary.
			DTXSwizzleMethod(NSClassFromString(@"UITextSelectionView"), @selector(_setCaretBlinkAnimationEnabled:), @selector(_dtx_setCaretBlinkAnimationEnabled:), &error);
		}
		else
		{
			if([NSUserDefaults.standardUserDefaults boolForKey:@"detoxDisableAnimationSpeedup"] == NO)
			{
				DTXSwizzleMethod(NSClassFromString(@"UITextSelectionView"), @selector(setCaretBlinks:), @selector(_dtx_setCaretBlinks:), &error);
			}
		}
	}
}

- (void)_dtx_setCaretBlinkAnimationEnabled:(BOOL)arg1
{
	[self _dtx_setCaretBlinkAnimationEnabled:NO];
}

- (void)_dtx_setCaretBlinks:(BOOL)arg1
{
	[self _dtx_setCaretBlinks:NO];
}

@end

@interface UIScrollView (DetoxSpeedup) @end
@implementation UIScrollView (DetoxSpeedup)

+ (void)load
{
	@autoreleasepool {
		if([NSUserDefaults.standardUserDefaults boolForKey:@"detoxDisableAnimationSpeedup"] == NO)
		{
			NSError* error;
			DTXSwizzleMethod(self, @selector(_hideScrollIndicators), @selector(_dtx_hideScrollIndicators), &error);
			DTXSwizzleMethod(self, @selector(_hideScrollIndicator:afterDelay:animated:), @selector(_dtx_hideScrollIndicator:afterDelay:animated:), &error);
		}
	}
}

- (void)_dtx_hideScrollIndicators
{
	[[self valueForKey:@"horizontalScrollIndicator"] setAlpha:0.0];
	[[self valueForKey:@"verticalScrollIndicator"] setAlpha:0.0];
}

- (void)_dtx_hideScrollIndicator:(UIView*)arg1 afterDelay:(NSTimeInterval)arg2 animated:(BOOL)arg3
{
	[arg1 setAlpha:0.0];
}

@end
