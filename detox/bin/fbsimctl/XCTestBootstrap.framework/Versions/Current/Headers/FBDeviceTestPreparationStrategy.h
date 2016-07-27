/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <XCTestBootstrap/FBXCTestPreparationStrategy.h>

@protocol FBFileManager;

/**
 Strategy used to run XCTest iOS Devices.
 Loads prepared bundles, then uploads them to device.
 */
@interface FBDeviceTestPreparationStrategy : NSObject <FBXCTestPreparationStrategy>

/**
 Creates and returns a strategy with given paramenters

 @param applicationPath path to tested application (.app)
 @param applicationDataPath path to application data bundle (.xcappdata)
 @param testBundlePath path to test bundle (.xctest)
 @returns Prepared FBLocalDeviceTestRunStrategy
 */
+ (instancetype)strategyWithApplicationPath:(NSString *)applicationPath
                        applicationDataPath:(NSString *)applicationDataPath
                             testBundlePath:(NSString *)testBundlePath;

/**
 Creates and returns a strategy with given paramenters

 @param applicationPath path to tested application (.app)
 @param applicationDataPath path to application data bundle (.xcappdata)
 @param testBundlePath path to test bundle (.xctest)
 @param fileManager file manager used to prepare all bundles
 @returns Prepared FBLocalDeviceTestRunStrategy
 */
+ (instancetype)strategyWithApplicationPath:(NSString *)applicationPath
                        applicationDataPath:(NSString *)applicationDataPath
                             testBundlePath:(NSString *)testBundlePath
                                fileManager:(id<FBFileManager>)fileManager;

@end
