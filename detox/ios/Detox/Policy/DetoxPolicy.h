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

@property (class, nonatomic, strong, readonly) DetoxPolicy* activePolicy NS_SWIFT_NAME(active);

@property (nonatomic, readonly) CGFloat visibilityPixelAlphaThreshold;
@property (nonatomic, readonly) CGFloat visibilityVisiblePixelRatioThreshold;
@property (nonatomic, copy, readonly) NSString* visibilityVisiblePixelRatioThresholdDescription;

@end

NS_ASSUME_NONNULL_END
