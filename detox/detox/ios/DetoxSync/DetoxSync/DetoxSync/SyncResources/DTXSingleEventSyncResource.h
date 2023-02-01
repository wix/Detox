//
//  DTXSingleUseSyncResource.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncResource-Private.h"
#import "DTXSyncManager.h"

NS_ASSUME_NONNULL_BEGIN

@protocol DTXSingleEvent <DTXTrackedEvent>

- (void)suspendTracking;
- (void)resumeTracking;

- (void)endTracking;

@end

@interface DTXSingleEventSyncResource : DTXSyncResource <DTXSingleEvent>

+ (id<DTXSingleEvent>)singleUseSyncResourceWithObjectDescription:(nullable NSString* )object eventDescription:(NSString*)description;

- (void)suspendTracking;
- (void)resumeTracking;

- (void)endTracking;

@end

NS_ASSUME_NONNULL_END
