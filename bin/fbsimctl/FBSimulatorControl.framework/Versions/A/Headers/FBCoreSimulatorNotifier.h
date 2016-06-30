/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBTerminationHandle.h>

@class FBSimulator;
@class FBSimulatorSet;
@class SimDevice;

/**
 A class for wrapping Core Simulator Notifiers in a `FBTerminationHandle`
 */
@interface FBCoreSimulatorNotifier : NSObject <FBTerminationHandle>

/**
 Creates and returns an FBSimDeviceNotifier for the lifecycle events that the Simulator's SimDevice broadcasts.

 @param simulator the FBSimulator to relay events from.
 @param block the block to call when events are sent from the SimDevice.
 @return an instance of FBSimDeviceNotifier for later termination.
 */
+ (instancetype)notifierForSimulator:(FBSimulator *)simulator block:(void (^)(NSDictionary *info))block;

/**
 Creates and returns an FBSimDeviceNotifier for the lifecycle events that SimDevice broadcasts.

 @param simDevice the FBSimulator to relay events from.
 @param block the block to call when events are sent from the SimDevice.
 @return an instance of FBSimDeviceNotifier for later termination.
 */
+ (instancetype)notifierForSimDevice:(SimDevice *)simDevice block:(void (^)(NSDictionary *info))block;

/**
 Creates and returns an FBSimDeviceNotifier for the lifecycle events that SimDeviceSet broadcasts for the provided Set.

 @param set the FBSimulator to relay events from.
 @param block the block to call when events are sent from the SimDevice.
 @return an instance of FBSimDeviceNotifier for later termination.
 */
+ (instancetype)notifierForSet:(FBSimulatorSet *)set block:(void (^)(NSDictionary *info))block;

@end
