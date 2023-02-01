//
//  UIAnimation+DTXSpy.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@interface UIAnimation : NSObject

- (void)markStop;
- (void)markStart:(double)arg1;

@end

@interface UIAnimation (DTXSpy)

@end

NS_ASSUME_NONNULL_END
