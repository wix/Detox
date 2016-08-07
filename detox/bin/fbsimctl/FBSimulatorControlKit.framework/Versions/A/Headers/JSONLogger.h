/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorControl.h>

@class JSONEventReporter;

/**
 A Bridge between JSONEventReporter and FBSimulatorLogger.
 Since the FBSimulatorLoggerProtocol omits the varags logFormat: method,
 this Objective-C implementation can do the appropriate bridging.
 */
@interface JSONLogger : NSObject <FBControlCoreLogger>

/**
 Constructs a new JSONLogger instance with the provided reporter.

 @param reporter the the Reporter to report to. Declared as 'id' to prevent the Swift Typechecker getting confused.
 @param debug YES if debug messages should be reported, NO otherwise.
 @return a new JSONLogger instance.
 */
+ (instancetype)withEventReporter:(id)reporter debug:(BOOL)debug;

@end
