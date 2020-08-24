//
//  UIDatePicker+DetoxActions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIDatePicker+DetoxActions.h"
#import "UIView+DetoxUtils.h"

@implementation UIDatePicker (DetoxActions)

- (void)dtx_adjustToDate:(NSDate*)date
{
	[self dtx_assertVisible];
	
	NSDate* previousDate = self.date;
	
	[self setDate:date animated:YES];
	
	if([previousDate isEqualToDate:date] == NO)
	{
		[self sendActionsForControlEvents:UIControlEventValueChanged];
	}
	
	//TODO: Is Waiting needed?
	dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
		//Noop
	});
}

@end
