//
//  NSURL+DetoxSyncUtils.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/14/20.
//  Copyright © 2020 wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSURL (DetoxSyncUtils)

- (BOOL)detox_sync_shouldTrack;

@end

NS_ASSUME_NONNULL_END
