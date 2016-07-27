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

@class FBProcessLaunchConfiguration;
@class FBSimulatorApplication;
@class FBSimulatorBinary;

/**
 A Diagnostic key for the Termination Status.
 */
extern NSString *const FBSimulatorHistoryDiagnosticNameTerminationStatus;

/**
 A value representing a history of events that have occurred for a Simulator.
 Can be serialized for reading across host processes.
 */
@interface FBSimulatorHistory : NSObject <NSCopying, NSCoding>

/**
 The Timestamp for the time that the event occurred.
 */
@property (nonatomic, copy, readonly) NSDate *timestamp;

/**
 The Simulator's State.
 */
@property (nonatomic, assign, readonly) FBSimulatorState simulatorState;

/**
 Process information for the processes that have been launched by FBSimulatorControl.
 Ordering is determined by time of launch; the most recently launched process is first.

 Is an NSArray<FBProcessInfo>
 */
@property (nonatomic, copy, readonly) NSArray *launchedProcesses;

/**
 Mapping for Process Info to the configuration of the last time the process was launched.

 Is an NSDictionary<FBProcessInfo, FBProcessLaunchConfiguration>
 */
@property (nonatomic, copy, readonly) NSDictionary *processLaunchConfigurations;

/**
 Per-Process Metadata. Is used to store small amounts of information about processes.

 Is an NSDictionary<FBProcessInfo, NSDictionary<NSString, id<NSCopying, NSCoding>>>.
 */
@property (nonatomic, copy, readonly) NSDictionary *processMetadata;

/**
 The last state, may be nil if this is the first instance.
 */
@property (nonatomic, copy, readonly) FBSimulatorHistory *previousState;

/**
 Describes all the changes of the reciever, to the first change.
 */
- (NSString *)recursiveChangeDescription;

@end
