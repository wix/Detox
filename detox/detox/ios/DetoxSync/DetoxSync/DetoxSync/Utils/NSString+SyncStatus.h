//
//  NSString+SyncStatus.h
//  DetoxSync
//
//  Created by asaf korem on 02/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Category for \c NSString with common keys for JSON representation of sync status.
@interface NSString (SyncStatus)

/// Key for the app status.
@property (nonatomic, readonly, class) NSString *dtx_appStatusKey;

/// Key for the busy resources.
@property (nonatomic, readonly, class) NSString *dtx_busyResourcesKey;

@end

NS_ASSUME_NONNULL_END
