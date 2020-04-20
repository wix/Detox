//
//  UIView+DetoxExpectations.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/19/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIView (DetoxExpectations)

@property (nonatomic, readonly) bool dtx_isVisible;
@property (nonatomic, readonly) bool dtx_isHittable;

@end

NS_ASSUME_NONNULL_END
