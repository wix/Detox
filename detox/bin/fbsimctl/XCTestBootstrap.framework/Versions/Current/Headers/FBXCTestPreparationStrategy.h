/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBTestRunnerConfiguration;
@protocol FBDeviceOperator;

/**
 A Protocol for preparing iOS for running an XCTest.
 */
@protocol FBXCTestPreparationStrategy

/**
 Prepares FBTestRunnerConfiguration

 @param deviceOperator deviceOperator used to prepare test
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return FBTestRunnerConfiguration configuration used to start test
 */
- (FBTestRunnerConfiguration *)prepareTestWithDeviceOperator:(id<FBDeviceOperator>)deviceOperator error:(NSError **)error;

@end
