/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBSimulatorHistory.h>

@interface FBSimulatorHistory ()

@property (nonatomic, copy, readwrite) NSDate *timestamp;
@property (nonatomic, copy, readwrite) FBSimulatorHistory *previousState;
@property (nonatomic, assign, readwrite) FBSimulatorState simulatorState;
@property (nonatomic, strong, readwrite) NSMutableOrderedSet *mutableLaunchedProcesses;
@property (nonatomic, strong, readwrite) NSMutableDictionary *mutableProcessLaunchConfigurations;
@property (nonatomic, strong, readwrite) NSMutableDictionary *mutableProcessMetadata;

@end
