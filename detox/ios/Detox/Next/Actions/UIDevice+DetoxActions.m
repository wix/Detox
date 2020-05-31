//
//  UIDevice+DetoxActions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/30/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIDevice+DetoxActions.h"
#import "DTXAppleInternals.h"

@implementation UIDevice (DetoxActions)

+ (void)dtx_setOrientation:(UIDeviceOrientation)deviceOrientation
{
	NSParameterAssert(NSThread.isMainThread);
	[[UIDevice currentDevice] setOrientation:deviceOrientation animated:YES];
}

+ (void)dtx_shake
{
	NSParameterAssert(NSThread.isMainThread);
	
	UIApplication *application = UIApplication.sharedApplication;
	
	UIWindow* window;
	if(@available(iOS 13, *))
	{
		window = UIWindowScene._keyWindowScene._keyWindow;
	}
	else
	{
		window = UIWindow.keyWindow;
	}
	UIMotionEvent *motionEvent = [application _motionEvent];
	
	[motionEvent setShakeState:1];
	[motionEvent _setSubtype:UIEventSubtypeMotionShake];
	[application sendEvent:motionEvent];
	[window motionBegan:UIEventSubtypeMotionShake withEvent:motionEvent];
	[window motionEnded:UIEventSubtypeMotionShake withEvent:motionEvent];
}


@end
