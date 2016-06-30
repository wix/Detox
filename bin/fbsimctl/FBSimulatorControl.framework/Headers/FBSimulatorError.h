/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <FBControlCore/FBControlCoreError.h>

@class FBSimulator;

/**
 The Error Domain for FBSimulatorControl.
 */
extern NSString *const FBSimulatorControlErrorDomain;

/**
 Helpers for constructing Errors representing errors in FBSimulatorControl & adding additional diagnosis.
 */
@interface FBSimulatorError : FBControlCoreError

/**
 Automatically attach Simulator diagnostic info.

 @param simulator the Simulator to obtain diagnostic information from.
 @return the reciever, for chaining.
 */
- (instancetype)inSimulator:(FBSimulator *)simulator;

@end
