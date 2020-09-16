//
//  UIImage+DetoxUtils.h
//  Detox
//
//  Created by Leo Natan on 9/13/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIImage (DetoxUtils)

- (NSUInteger)dtx_numberOfVisiblePixelsWithThreshold:(CGFloat)threshold totalPixels:(NSUInteger*)totalPixels;

#if DEBUG
- (void)dtx_saveToDesktop;
#endif

@end

NS_ASSUME_NONNULL_END
