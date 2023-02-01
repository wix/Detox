//
//  DTXTimerSyncResource-Private.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/29/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXTimerSyncResource.h"
@class _DTXTimerTrampoline;

NS_ASSUME_NONNULL_BEGIN

@interface DTXTimerSyncResource ()

@property (class, nonatomic, strong, readonly) DTXTimerSyncResource* sharedInstance NS_SWIFT_NAME(shared);

- (void)trackTimerTrampoline:(_DTXTimerTrampoline*)timerTrampoline NS_SWIFT_NAME(track(_:));
- (void)untrackTimerTrampoline:(_DTXTimerTrampoline*)timerTrampoline NS_SWIFT_NAME(untrack(_:));

+ (void)clearTimersForCFRunLoop:(CFRunLoopRef)cfRunLoop;

@end

NS_ASSUME_NONNULL_END
