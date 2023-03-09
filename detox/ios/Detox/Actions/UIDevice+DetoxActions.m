//
//  UIDevice+DetoxActions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/30/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIDevice+DetoxActions.h"
#import "DTXAppleInternals.h"
#import "UIWindow+DetoxUtils.h"

@implementation UIDevice (DetoxActions)

+ (void)dtx_shake
{
	NSParameterAssert(NSThread.isMainThread);
	
	UIApplication *application = UIApplication.sharedApplication;
	
	UIWindow* window = UIWindow.dtx_keyWindow;
	UIMotionEvent *motionEvent = [application _motionEvent];
	
	[motionEvent setShakeState:1];
	[motionEvent _setSubtype:UIEventSubtypeMotionShake];
	[application sendEvent:motionEvent];
	[window motionBegan:UIEventSubtypeMotionShake withEvent:motionEvent];
	[window motionEnded:UIEventSubtypeMotionShake withEvent:motionEvent];
}


@end
