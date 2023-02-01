//
//  DTXDispatchQueueSyncResource+Private.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/29/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXDispatchQueueSyncResource.h"

NS_ASSUME_NONNULL_BEGIN

@interface DTXDispatchQueueSyncResource ()

+ (nullable instancetype)_existingSyncResourceWithQueue:(dispatch_queue_t)queue;
+ (nullable instancetype)_existingSyncResourceWithQueue:(dispatch_queue_t)queue cleanup:(BOOL)cleanup;

- (nullable NSString*)addWorkBlock:(id)block operation:(NSString*)operation moreInfo:(nullable NSString*)moreInfo;
- (void)removeWorkBlock:(id)block operation:(NSString*)operation identifier:(NSString*)identifier;

@end

NS_ASSUME_NONNULL_END
