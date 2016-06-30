/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorEventSink.h>

@class FBTestManager;
/**
 An event sink responsible for cleaning up resources that are allocated for Simulators and their subprocesses.
 */
@interface FBSimulatorResourceManager : NSObject <FBSimulatorEventSink>

/**
 Set of connected test manager daemons
 */
@property (nonatomic, copy, readonly, nonnull) NSSet<FBTestManager *> *testManagers;

@end
