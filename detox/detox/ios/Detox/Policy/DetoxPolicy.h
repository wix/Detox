//
//  DetoxPolicy.h
//  Detox
//
//  Created by Leo Natan on 9/15/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DetoxPolicy : NSObject

@property (class, nonatomic, readonly) CGFloat visibilityPixelAlphaThreshold;
@property (class, nonatomic, readonly) NSUInteger defaultPercentThresholdForVisibility;
@property (class, nonatomic, readonly) NSUInteger consecutiveTouchPointsWithSameContentOffsetThreshold;

+ (NSString*)percentDescriptionForPercent:(CGFloat)percent;

@end

NS_ASSUME_NONNULL_END
