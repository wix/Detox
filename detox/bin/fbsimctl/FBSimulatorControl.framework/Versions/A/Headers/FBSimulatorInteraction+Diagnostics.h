/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorInteraction.h>

@class FBSimulatorApplication;

@interface FBSimulatorInteraction (Diagnostics)

/**
 Uses sample(1) see what is going on in the Application. This is done asynchronously.
 The result is attached to the Simulator History. If an error occurs during the run of the sample(1), no result will be attached.

 @param application the Application to sample. Must be running, otherwise the interaction will error.
 @param durationInSeconds the duration for which to sample the Application.
 @param frequencyInMilliseconds the frequency with which to sample.
 @returns the reciever, for chaining.
 */
 - (instancetype)sampleApplication:(FBSimulatorApplication *)application withDuration:(NSInteger)durationInSeconds frequency:(NSInteger)frequencyInMilliseconds;

/**
 Executes a command with lldb(1). This is done asynchronously.
 The result is attached to the Simulator History. If an error occurs during the run of the lldb command, no result will be returned.

 @param application the Application to sample. Must be running, otherwise the interaction will fail.
 @param command to execute.
 @returns the reciever, for chaining.
 */
- (instancetype)onApplication:(FBSimulatorApplication *)application executeLLDBCommand:(NSString *)command;

@end
