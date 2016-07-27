/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBProcessInfo;
@class FBSimulator;

/**
 An Interface to a Simulator's launchctl.
 */
@interface FBSimulatorLaunchCtl : NSObject

/**
 Creates a FBSimulatorLaunchCtl instance for the provided Simulator

 @param simulator the Simulator to create a launchctl wrapper for.
 @return a new FBSimulatorLaunchCtl instance.
 */
+ (instancetype)withSimulator:(FBSimulator *)simulator;

/**
 Consults the Simulator's launchctl to determine if the given process

 @param process the Simulator to create a launchctl wrapper for.
 @param error an error for any error that occurs.
 @return a new FBSimulatorLaunchCtl instance.
 */
- (BOOL)processIsRunningOnSimulator:(FBProcessInfo *)process error:(NSError **)error;

@end
