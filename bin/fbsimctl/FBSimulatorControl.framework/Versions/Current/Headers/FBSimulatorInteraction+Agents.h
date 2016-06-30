/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorInteraction.h>

@class FBAgentLaunchConfiguration;
@class FBSimulatorBinary;

@interface FBSimulatorInteraction (Agents)

/**
 Launches the provided Agent with the given Configuration.

 @param agentLaunch the Agent Launch Configuration to Launch.
 @return the reciever, for chaining.
 */
- (instancetype)launchAgent:(FBAgentLaunchConfiguration *)agentLaunch;

/**
 Launches the provided Agent.

 @param agent the Agent Launch Configuration to Launch.
 @return the reciever, for chaining.
 */
- (instancetype)killAgent:(FBSimulatorBinary *)agent;

@end
