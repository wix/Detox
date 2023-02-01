//
//  DTXTypedefs.h
//  DetoxSync
//
//  Created by asaf korem on 21/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

NS_ASSUME_NONNULL_BEGIN

/// Type of busy sync resource.
typedef NSDictionary<NSString *, id> DTXBusyResource;

/// Type of busy-resources array.
typedef NSArray<DTXBusyResource *> DTXBusyResources;

/// Type of synchronization status result.
typedef NSDictionary<NSString *, id> DTXSyncStatus;

/// Filtering block, used for filter methods on arrays.
typedef BOOL(^FilterBlock)(id object);

/// Mapping block, used for map methods on arrays.
typedef id _Nonnull (^MapBlock)(id object);

/// Filtering block, used for filter methods on dictionaries.
typedef BOOL(^FilterBlockWithKeyValue)(id key, id value);

/// Mapping block, used for map methods on dictionaries.
typedef id _Nonnull (^MapBlockWithKeyValue)(id key, id value);

NS_ASSUME_NONNULL_END
