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

- (void)dtx_scrollToEdge:(UIRectEdge)edge NS_SWIFT_NAME(dtx_scroll(to:));
- (void)dtx_scrollWithOffset:(CGPoint)offset;
- (void)dtx_scrollWithOffset:(CGPoint)offset normalizedStartingPoint:(CGPoint)normalizedStartingPoint NS_SWIFT_NAME(dtx_scroll(withOffset:normalizedStartingPoint:));

@end

NS_ASSUME_NONNULL_END
