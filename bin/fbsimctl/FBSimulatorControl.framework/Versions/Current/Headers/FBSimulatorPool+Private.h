/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorPool.h>

@class FBProcessFetcher;

@interface FBSimulatorPool ()

@property (nonatomic, strong, readonly) id<FBControlCoreLogger> logger;
@property (nonatomic, strong, readonly) NSMutableOrderedSet *allocatedUDIDs;
@property (nonatomic, strong, readonly) NSMutableDictionary *allocationOptions;

- (instancetype)initWithSet:(FBSimulatorSet *)set logger:(id<FBControlCoreLogger>)logger;

@end
