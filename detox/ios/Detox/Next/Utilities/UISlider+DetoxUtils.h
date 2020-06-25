//
//  UISlider+DetoxUtils.h
//  Detox
//
//  Created by Leo Natan (Wix) on 5/28/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UISlider (DetoxUtils)

@property (nonatomic, getter=dtx_normalizedSliderPosition, setter=dtx_setNormalizedSliderPosition:) double dtx_normalizedSliderPosition;

@end

NS_ASSUME_NONNULL_END
