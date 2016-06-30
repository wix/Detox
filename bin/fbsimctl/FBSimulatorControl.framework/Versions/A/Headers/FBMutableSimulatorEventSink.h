/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorEventSink.h>

/**
 An Event Sink that can be changed with an Event Sink of the User's choosing at Runtime.
 This allows th
 */
@interface FBMutableSimulatorEventSink : NSObject <FBSimulatorEventSink>

/**
 The Event Sink to currently use, may be nil
 */
@property (nonatomic, strong, readwrite) id<FBSimulatorEventSink> eventSink;

@end
