//
//  NSString+SyncResource.h
//  DetoxSync
//
//  Created by Asaf Korem on 31/10/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Category for \c NSString with common keys for JSON descriptions of sync resources.
///
/// @see \c jsonDescription method of classes that inherits from \c DTXSyncResource.
@interface NSString (SyncResource)

/// Key for the name of the resource.
@property (nonatomic, readonly, class) NSString *dtx_resourceNameKey;

/// Key for the description of the resource.
@property (nonatomic, readonly, class) NSString *dtx_resourceDescriptionKey;

@end

NS_ASSUME_NONNULL_END
