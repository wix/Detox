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

- (NSUInteger)consecutiveTouchPointsWithSameContentOffsetThreshold
{
	return 2;
}

+ (NSString*)descriptionForDouble:(CGFloat)number
{
	static NSNumberFormatter* formatter;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		formatter = [NSNumberFormatter new];
		formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US"];
		formatter.numberStyle = NSNumberFormatterPercentStyle;
	});
	
	return [formatter stringFromNumber:@(number)];
}

- (NSString *)visibilityVisiblePixelRatioThresholdDescription
{
	return [self.class descriptionForDouble:self.visibilityVisiblePixelRatioThreshold];
}

@end
