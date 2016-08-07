/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBSimulator.h>

NS_ASSUME_NONNULL_BEGIN

@protocol FBControlCoreLogger;
@class FBSimulatorConnection;

/**
 Connecting and Disconnecting to the FBSimulatorConnection
 */
@interface FBSimulator (Connection)

/**
 Connects to the FBSimulatorConnection.

 @param error an error out for any error that occurs.
 @return the Simulator Connection on success, nil otherwise.
 */
- (nullable FBSimulatorConnection *)connectWithError:(NSError **)error;

/**
 Disconnects from FBSimulatorConnection.

 @param timeout the timeout in seconds to wait for all connected components to disconnect.
 @param logger a logger to log to
 @param error an error for any error that occurs.
 @return YES if successful, NO otherwise.
 */
- (BOOL)disconnectWithTimeout:(NSTimeInterval)timeout logger:(nullable id<FBControlCoreLogger>)logger error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
