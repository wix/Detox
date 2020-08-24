//
//  UISlider+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan (Wix) on 5/28/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UISlider+DetoxUtils.h"

@implementation UISlider (DetoxUtils)

- (double)dtx_normalizedSliderPosition
{
	if(self.maximumValue == 0.0)
	{
		//No nans allowed.
		return 0.0;
	}
	
	return (self.value - self.minimumValue) / self.maximumValue;
}

- (void)dtx_setNormalizedSliderPosition:(double)dtx_normalizedSliderPosition
{
	self.value = dtx_normalizedSliderPosition * (self.maximumValue - self.minimumValue) + self.minimumValue;
}

@end
