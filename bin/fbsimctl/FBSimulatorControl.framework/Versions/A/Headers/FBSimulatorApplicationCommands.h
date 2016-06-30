/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBControlCore.h>

NS_ASSUME_NONNULL_BEGIN

@class FBSimulator;

/**
 Implementation of FBApplicationCommands for Simulators.
 */
@interface FBSimulatorApplicationCommands : NSObject <FBApplicationCommands>

/**
 Creates a FBSimulatorApplicationCommands instance.

 @param simulator the Simulator to perform actions on.
 @return a new FBSimulatorApplicationCommands instance.
 */
+ (instancetype)withSimulator:(FBSimulator *)simulator;

@end

NS_ASSUME_NONNULL_END
