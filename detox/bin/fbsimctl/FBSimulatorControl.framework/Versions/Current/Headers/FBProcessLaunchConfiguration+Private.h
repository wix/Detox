/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBProcessLaunchConfiguration.h>

@interface FBProcessLaunchConfiguration ()

@property (nonatomic, copy, readwrite) NSArray<NSString *> *arguments;
@property (nonatomic, copy, readwrite) NSDictionary<NSString *, NSString *> *environment;
@property (nonatomic, assign, readwrite) FBProcessLaunchOptions options;

@end

@interface FBApplicationLaunchConfiguration ()

@property (nonatomic, copy, readwrite) NSString *bundleID;
@property (nonatomic, copy, readwrite) NSString *bundleName;

@end

@interface FBAgentLaunchConfiguration ()

@property (nonatomic, copy, readwrite) FBSimulatorBinary *agentBinary;

@end
