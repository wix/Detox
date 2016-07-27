/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <XCTestBootstrap/FBXCTestPreparationStrategy.h>

@protocol FBFileManager;

/**
 Strategy used to run XCTest with Simulators.
 It will copy the Test Bundle to a working directory and update with an appropriate xctestconfiguration.
 */
@interface FBSimulatorTestPreparationStrategy : NSObject <FBXCTestPreparationStrategy>

/**
 Creates and returns a strategy with given paramenters

 @param testRunnerBundleID a bundle ID of apllication used to start tests
 @param testBundlePath path to test bundle (.xctest)
 @param workingDirectory directory used to prepare all bundles
 @returns Prepared FBSimulatorTestRunStrategy
 */
+ (instancetype)strategyWithTestRunnerBundleID:(NSString *)testRunnerBundleID
                                testBundlePath:(NSString *)testBundlePath
                              workingDirectory:(NSString *)workingDirectory;

/**
 Creates and returns a strategy with given paramenters

 @param testRunnerBundleID a bundle ID of apllication used to start tests
 @param testBundlePath path to test bundle (.xctest)
 @param workingDirectory directory used to prepare all bundles
 @param fileManager file manager used to prepare all bundles
 @returns Prepared FBSimulatorTestRunStrategy
 */
+ (instancetype)strategyWithTestRunnerBundleID:(NSString *)testRunnerBundleID
                                testBundlePath:(NSString *)testBundlePath
                              workingDirectory:(NSString *)workingDirectory
                                   fileManager:(id<FBFileManager>)fileManager;

@end
