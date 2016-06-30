/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@protocol FBDeviceOperator;
@protocol FBControlCoreLogger;
@protocol FBTestManagerTestReporter;

NS_ASSUME_NONNULL_BEGIN

/**
 Manages a connection with the 'testmanagerd' daemon.
 */
@interface FBTestManager : NSObject

/**
 Creates and returns a test manager with given paramenters.

 @param deviceOperator a device operator used to handle device.
 @param testRunnerPID a process id of test runner (XCTest bundle).
 @param sessionIdentifier a session identifier of test that should be started.
 @param reporter an optional reporter to report test progress to.
 @param logger the logger object to log events to, may be nil.
 @return Prepared FBTestManager
 */
+ (instancetype)testManagerWithOperator:(id<FBDeviceOperator>)deviceOperator testRunnerPID:(pid_t)testRunnerPID sessionIdentifier:(NSUUID *)sessionIdentifier reporter:(id<FBTestManagerTestReporter>)reporter logger:(id<FBControlCoreLogger>)logger;

/**
 Connects to the 'testmanagerd' daemon.

 @param timeout the Time to wait for the connection to be established.
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return YES if operation was successful, NO otherwise.
 */
- (BOOL)connectWithTimeout:(NSTimeInterval)timeout error:(NSError **)error;

/**
 Disconnects from the 'testmanagerd' daemon.
 */
- (void)disconnect;

@end

NS_ASSUME_NONNULL_END
