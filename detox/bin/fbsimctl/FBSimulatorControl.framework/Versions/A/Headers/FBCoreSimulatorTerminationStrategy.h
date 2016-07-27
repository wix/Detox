/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBProcessFetcher;
@protocol FBControlCoreLogger;

/**
 A Strategy for killing 'com.apple.CoreSimulatorService' processes that are not from the current Xcode version.
 */
@interface FBCoreSimulatorTerminationStrategy : NSObject

/**
 Creates and returns a new Core Simulator Termination Strategy from the arguments.

 @param processFetcher the Process Query object to use.
 @param logger the logger to use.
 */
+ (instancetype)withProcessFetcher:(FBProcessFetcher *)processFetcher logger:(id<FBControlCoreLogger>)logger;

/**
 Kills all of the 'com.apple.CoreSimulatorService' processes that are not used by the current `FBSimulatorControl` configuration.
 Running multiple versions of the Service on the same machine can lead to instability such as Simulator statuses not updating.

 @param error an error out if any error occured.
 @return an YES if successful, nil otherwise.
 */
- (BOOL)killSpuriousCoreSimulatorServicesWithError:(NSError **)error;

@end
