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
	
	BKSAccelerometer *accelerometer = [UIApplication.sharedApplication._motionEvent valueForKey:@"_motionAccelerometer"];
	BOOL prevValue = accelerometer.accelerometerEventsEnabled;
	accelerometer.accelerometerEventsEnabled = YES;
	
	// This behaves exactly in the same manner that UIApplication handles the simulator
	// "Shake Gesture" menu command.
	[UIApplication.sharedApplication _sendMotionBegan:UIEventSubtypeMotionShake];
	[UIApplication.sharedApplication _sendMotionEnded:UIEventSubtypeMotionShake];
	
	accelerometer.accelerometerEventsEnabled = prevValue;
}


@end
