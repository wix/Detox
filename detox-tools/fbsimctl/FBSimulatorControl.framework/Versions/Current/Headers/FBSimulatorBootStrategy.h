/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBSimulator;
@class FBSimulatorLaunchConfiguration;

NS_ASSUME_NONNULL_BEGIN

/**
 A Strategy for Booting a Simulator's Bridge.
 */
@interface FBSimulatorBootStrategy : NSObject

/**
 Creates and returns a new strategy with the given configuration.

 @param configuration the configuration to use.
 @param simulator the simulator to boot.
 @return a new FBSimulatorBootStrategy instance.
 */
+ (instancetype)withConfiguration:(FBSimulatorLaunchConfiguration *)configuration simulator:(FBSimulator *)simulator;

/**
 Boots the Simulator.

 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
- (BOOL)boot:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
