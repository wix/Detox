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
#import <FBSimulatorControl/FBSimulatorEventSink.h>
#import <FBSimulatorControl/FBSimulatorHistory.h>

@class FBProcessLaunchConfiguration;
@class FBSimulatorBinary;

/**
 An Object responsible for building `FBSimulatorHistory` be converting events into state.
 Links are maintained to previous states, so the entire history of the Simulator can be interrogated at any time.

 Is also responsible for serializing/deserializing prior history to file.
 */
@interface FBSimulatorHistoryGenerator : NSObject <FBSimulatorEventSink>

/**
 Creates and returns a History Generator for the Provided Simulator.

 @param simulator the Simulator to generate history for. Will not be retained. Must not be nil.
 @return a new FBSimulatorHistoryGenerator instance
 */
+ (instancetype)forSimulator:(FBSimulator *)simulator;

/**
 The Current History, will be updated as events are recieved.
 */
@property (nonatomic, strong, readonly) FBSimulatorHistory *history;

/**
 If set to YES: History will be serialized to file.
 If set to NO: History will not be serialized to file.

 When setting this to NO, persistent history will be deleted from the filesystem.
 */
@property (nonatomic, assign, readwrite, getter=isPersistenceEnabled) BOOL peristenceEnabled;

@end
