//
//  DetoxPolicy.m
//  Detox
//
//  Created by Leo Natan on 9/15/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "DetoxPolicy.h"

static DetoxPolicy* _activePolicy;

@implementation DetoxPolicy

+ (DetoxPolicy *)activePolicy
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		_activePolicy = [DetoxPolicy new];
	});
	
	return _activePolicy;
}

- (CGFloat)visibilityPixelAlphaThreshold
{
	return 0.5;
}

- (CGFloat)visibilityVisiblePixelRatioThreshold
{
	return 0.75;
}

- (NSString *)visibilityVisiblePixelRatioThresholdDescription
{
	static NSNumberFormatter* formatter;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		formatter = [NSNumberFormatter new];
		formatter.numberStyle = NSNumberFormatterPercentStyle;
	});
	
	return [formatter stringFromNumber:@(self.visibilityVisiblePixelRatioThreshold)];
}

@end
