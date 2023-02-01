//
//  DTXDelayedPerformSelectorSyncResource.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/29/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncResource.h"

NS_ASSUME_NONNULL_BEGIN

@protocol DTXDelayedPerformSelectorProxy <NSObject>

- (void)fire;

@end

@interface DTXDelayedPerformSelectorSyncResource : DTXSyncResource

+ (id<DTXDelayedPerformSelectorProxy>)delayedPerformSelectorProxyWithTarget:(id)target selector:(SEL)selector object:(id)obj;

@end

NS_ASSUME_NONNULL_END
