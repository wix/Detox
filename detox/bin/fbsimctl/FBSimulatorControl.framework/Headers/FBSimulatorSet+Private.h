/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorSet.h>

@interface FBSimulatorSet ()

@property (nonatomic, strong, readonly) NSMutableDictionary *inflatedSimulators;

- (instancetype)initWithConfiguration:(FBSimulatorControlConfiguration *)configuration deviceSet:(SimDeviceSet *)deviceSet control:(FBSimulatorControl *)control logger:(id<FBControlCoreLogger>)logger;

@end
