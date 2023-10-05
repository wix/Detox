//
//  DetoxPolicy.m
//  Detox
//
//  Created by Leo Natan on 9/15/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "DetoxPolicy.h"

@implementation DetoxPolicy

+ (CGFloat)visibilityPixelAlphaThreshold {
	return 0.5;
}

+ (NSUInteger)defaultPercentThresholdForVisibility {
	return 75;
}

+ (NSUInteger)consecutiveTouchPointsWithSameContentOffsetThreshold {
	return 12;
}

+ (NSString*)percentDescriptionForPercent:(CGFloat)percent {
	return [NSString stringWithFormat:@"%g%%", percent];
}

@end
