/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBSimulatorEventSink.h>

@class FBSimulator;

/**
 An Event Relay that writes messages to a logger.
 */
@interface FBSimulatorLoggingEventSink : NSObject <FBSimulatorEventSink>

/**
 Creates a new Logging Event Sink for the provided Simulator.

 @param simulator the Simulator to log events for. Will not be retained. Must not be nil.
 @param logger the Logger to write messages to. May be nil.
 @return a new FBSimulatorLoggingEventSink instance.
 */
+ (instancetype)withSimulator:(FBSimulator *)simulator logger:(id<FBControlCoreLogger>)logger;

@end
