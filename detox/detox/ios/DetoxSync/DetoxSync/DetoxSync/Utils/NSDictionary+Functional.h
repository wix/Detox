//
//  NSDictionary+Functional.h
//  DetoxSync
//
//  Created by asaf korem on 22/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Category for functional methods on dictionary.
@interface NSDictionary (Functional)

/// Filters objects by value in the dictionary using the given \c block.
- (NSDictionary *)filter:(FilterBlockWithKeyValue)block;

/// Maps objects by value in the dictionary using the given \c block.
- (NSDictionary *)map:(MapBlockWithKeyValue)block;

@end

NS_ASSUME_NONNULL_END
