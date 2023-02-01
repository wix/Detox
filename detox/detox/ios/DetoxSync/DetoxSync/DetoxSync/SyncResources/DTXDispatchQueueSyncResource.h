//
//  DTXDispatchQueueSyncResource.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/29/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncResource.h"

NS_ASSUME_NONNULL_BEGIN

@interface DTXDispatchQueueSyncResource : DTXSyncResource

/// Name of the dispatch queue that is being tracked.
@property (nonatomic, copy) NSString* queueName;

+ (instancetype)dispatchQueueSyncResourceWithQueue:(dispatch_queue_t)queue;

@end

NS_ASSUME_NONNULL_END
