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

- (UIImage*)dtx_imageByCroppingInRect:(CGRect)rect;
- (NSUInteger)dtx_numberOfVisiblePixelsWithAlphaThreshold:(CGFloat)threshold totalPixels:(NSUInteger*)totalPixels;

- (void)dtx_saveToPath:(NSURL*)path fileName:(NSString*)name;

@end

NS_ASSUME_NONNULL_END
