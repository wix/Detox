//
//  DTXRunLoopSyncResource-Private.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/6/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXRunLoopSyncResource.h"

NS_ASSUME_NONNULL_BEGIN

@interface DTXRunLoopSyncResource ()

+ (nullable instancetype)_existingSyncResourceWithRunLoop:(CFRunLoopRef)runLoop clear:(BOOL)clear;
- (void)_startTracking;
- (void)_stopTracking;

- (void)_setBusy:(BOOL)isBusyNow;
@property (nonatomic, assign, getter=_wasPreviouslyBusy, setter=_setWasPreviouslyBusy:) BOOL _wasPreviouslyBusy;

@end

NS_ASSUME_NONNULL_END
