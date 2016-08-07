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

@class FBSimulator;

/**
 A Wrapper around the mach_port_t that is created in the booting of a Simulator.
 The IndigoHIDRegistrationPort is essential for backboard, otherwise UI events aren't synthesized properly.
 */
@interface FBSimulatorHID : NSObject <FBDebugDescribeable, FBJSONSerializable>

/**
 Creates and returns a FBSimulatorHID Instance for the provided Simulator.
 Will fail if a HID Port could not be registered for the provided Simulator.

 @param simulator the Simulator to create a IndigoHIDRegistrationPort for.
 @param error an error out for any error that occurs.
 @return a FBSimulatorHID if successful, nil otherwise.
 */
+ (instancetype)hidPortForSimulator:(FBSimulator *)simulator error:(NSError **)error;

/**
 Disconnects from the remote HID.
 */
- (void)disconnect;

@end
