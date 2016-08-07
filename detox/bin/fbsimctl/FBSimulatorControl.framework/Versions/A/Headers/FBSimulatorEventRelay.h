/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorEventSink.h>

@class FBProcessFetcher;

/**
 Automatically subscribes to event sources that create Simulator Events passively.
 The results of these event sources are translated into events for the relayed sink.

 Since passive events can duplicate those generate by FBSimulatorControl callers,
 this class also de-duplicates events.
 */
@interface FBSimulatorEventRelay : NSObject <FBSimulatorEventSink>

/**
 The Designated Initializer.

 @param simDevice the SimDevice to relay events for.
 @param processFetcher the Process Query for obtaining process information.
 @param sink the sink to forward to.
 */
- (instancetype)initWithSimDevice:(SimDevice *)simDevice processFetcher:(FBProcessFetcher *)processFetcher sink:(id<FBSimulatorEventSink>)sink;

/**
 The current Simulator Launch Info.
 */
@property (nonatomic, copy, readonly) FBProcessInfo *launchdProcess;

/**
 The current Container Application
 */
@property (nonatomic, copy, readonly) FBProcessInfo *containerApplication;

/**
 The current Simulator Connection.
 */
@property (nonatomic, strong, readonly) FBSimulatorConnection *connection;

@end
