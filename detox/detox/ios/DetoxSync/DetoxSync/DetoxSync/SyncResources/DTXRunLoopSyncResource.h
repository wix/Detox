//
//  DTXRunLoopSyncResource.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/6/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncResource.h"

NS_ASSUME_NONNULL_BEGIN

@interface DTXRunLoopSyncResource : DTXSyncResource

/// Name of the run loop that is being tracked.
@property (nonatomic, copy) NSString* runLoopName;

+ (instancetype)runLoopSyncResourceWithRunLoop:(CFRunLoopRef)runLoop;

@end

NS_ASSUME_NONNULL_END
