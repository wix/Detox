//
//  UIView+Drawing.h
//  Detox
//
//  Created by Leo Natan on 9/17/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIView (Drawing)

@property(nonatomic, readonly) CGRect dtx_recursiveBounds;

- (void)dtx_drawViewHierarchyUpToSubview:(UIView*)subview inRect:(CGRect)rect afterScreenUpdates:(BOOL)afterUpdates;

@end

NS_ASSUME_NONNULL_END
