//
//  UIScrollView+DetoxActions.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIScrollView (DetoxActions)

- (void)dtx_scrollToNormalizedEdge:(CGPoint)edge;
- (void)dtx_scrollWithOffset:(CGPoint)offset;
- (void)dtx_scrollWithOffset:(CGPoint)offset normalizedStartingOffset:(CGPoint)normalizedStartingOffset;

@end

NS_ASSUME_NONNULL_END
