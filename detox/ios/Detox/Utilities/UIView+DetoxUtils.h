//
//  UIView+DetoxUtils.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/27/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <NSObject+DetoxUtils.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIView (DetoxUtils)

@property (nonatomic, readonly, weak) UIViewController* dtx_containingViewController;
- (UIImage*)dtx_imageFromView;

@end

NS_ASSUME_NONNULL_END
