//
//  CAAnimation+DTXSpy.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import <QuartzCore/QuartzCore.h>

NS_ASSUME_NONNULL_BEGIN

@interface CAAnimation (DTXSpy)

- (void)__detox_sync_trackAnimation;
- (void)__detox_sync_untrackAnimation;

@end

NS_ASSUME_NONNULL_END
