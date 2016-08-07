// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <mach/exc.h>
#import <mach/mig.h>

#import <Foundation/Foundation.h>

@class FBFramebuffer;
@class FBSimulator;
@class FBSimulatorBridge;

NS_ASSUME_NONNULL_BEGIN

/**
 A Strategy for Connecting to a Simulator's Bridge.
 */
@interface FBSimulatorConnectStrategy : NSObject

/**
 Returns a Strategy for connecting to the Bridge of a Simulator.

 @param simulator the Simulator to connect to.
 @param framebuffer the Framebuffer instance to connect.
 @param hidPort the hid port to connect.
 @return a FBSimulatorConnectStategy instance.
 */
+ (instancetype)withSimulator:(FBSimulator *)simulator framebuffer:(nullable FBFramebuffer *)framebuffer hidPort:(mach_port_t)hidPort;

/**
 Connects a Bridge to the Simulator

 @param error an error out for any error that occurs.
 @return the Bridge if successful, nil otherwise.
 */
- (FBSimulatorBridge *)connect:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
