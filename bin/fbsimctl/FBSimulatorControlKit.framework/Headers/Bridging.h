/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBSimulatorControl.h>

NS_ASSUME_NONNULL_BEGIN

@class ControlCoreLoggerBridge;

/**
 Bridging Preprocessor Macros to values, so that they can be read in Swift.
 */
@interface Constants : NSObject

+ (int32_t)sol_socket;
+ (int32_t)so_reuseaddr;

+ (int32_t)asl_level_info;
+ (int32_t)asl_level_debug;
+ (int32_t)asl_level_err;

@end

/**
 Coercion to JSON Serializable Representations
 */
@interface NSString (FBJSONSerializable) <FBJSONSerializable>
@end

@interface NSArray (FBJSONSerializable) <FBJSONSerializable>
@end

/**
 A Bridge between JSONEventReporter and FBSimulatorLogger.
 Since the FBSimulatorLoggerProtocol omits the varags logFormat: method,
 this Objective-C implementation can do the appropriate bridging.
 */
@interface LogReporter : NSObject <FBControlCoreLogger>

/**
 Constructs a new JSONLogger instance with the provided reporter.

 @param bridge the bridge to report messages to.
 @param debug YES if debug messages should be reported, NO otherwise.
 @return a new JSONLogger instance.
 */
- (instancetype)initWithBridge:(ControlCoreLoggerBridge *)bridge debug:(BOOL)debug;

@end

NS_ASSUME_NONNULL_END
