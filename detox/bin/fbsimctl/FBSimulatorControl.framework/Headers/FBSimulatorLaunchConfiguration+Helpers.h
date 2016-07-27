/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBSimulatorLaunchConfiguration.h>

@class FBSimulator;

@interface FBSimulatorLaunchConfiguration (Helpers)

/**
 Creates and returns the arguments to pass to Xcode's Simulator.app for the reciever's configuration.

 @param simulator the Simulator construct boot args for.
 @param error an error out for any error that occurs.
 @return an NSArray<NSString> of boot arguments, or nil if an error occurred.
 */
 - (NSArray *)xcodeSimulatorApplicationArgumentsForSimulator:(FBSimulator *)simulator error:(NSError **)error;

/**
 Whether the reciever represents a configuration that should call SimDevice booting directly.
 */
- (BOOL)shouldUseDirectLaunch;

/**
 Whether the reciever represents a configuration that should boot via the NSWorkspace Application Launch API.
 */
- (BOOL)shouldLaunchViaWorkspace;

/**
 Whether the reciever represents a configuration that should connect the Bridge on Launch.
 */
- (BOOL)shouldConnectBridge;

@end
