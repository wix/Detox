//
//  UIDevice+DetoxActions.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/30/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIDevice (DetoxActions)

+ (void)dtx_setOrientation:(UIDeviceOrientation)deviceOrientation;
+ (void)dtx_shake;

@end

NS_ASSUME_NONNULL_END
