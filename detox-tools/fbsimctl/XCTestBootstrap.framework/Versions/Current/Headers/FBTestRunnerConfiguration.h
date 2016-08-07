/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBApplicationDataPackage;
@class FBProductBundle;
@class FBTestBundle;
@class FBTestConfiguration;

/**
 A Configuration Value for the Test Runner.
 */
@interface FBTestRunnerConfiguration : NSObject

/**
 Test session identifier
 */
@property (nonatomic, copy, readonly) NSUUID *sessionIdentifier;

/**
 Test runner app used for testing
 */
@property (nonatomic, strong, readonly) FBProductBundle *testRunner;

/**
  Launch arguments for test runner
 */
@property (nonatomic, copy, readonly) NSArray *launchArguments;

/**
 Launch environment variables for test runner
 */
@property (nonatomic, copy, readonly) NSDictionary *launchEnvironment;

@end

/**
 Prepares configuration for test runner
 */
@interface FBTestRunnerConfigurationBuilder : NSObject

/**
 @return Prepared FBTestRunnerConfiguration
 */
+ (instancetype)builder;

/**
 @param frameworkSearchPath search pth to frameworks
 @return builder
 */
- (instancetype)withFrameworkSearchPath:(NSString *)frameworkSearchPath;

/**
 @required

 @param sessionIdentifier identifier used to run test
 @return builder
 */
- (instancetype)withSessionIdentifer:(NSUUID *)sessionIdentifier;

/**
 @required

 @param testRunnerApplication test runner application bundle
 @return builder
 */
- (instancetype)withTestRunnerApplication:(FBProductBundle *)testRunnerApplication;

/**
 @required

 @param testConfigurationPath path to test configuration that should be used to start tests
 @return builder
 */
- (instancetype)withTestConfigurationPath:(NSString *)testConfigurationPath;

/**
 @required

 @param IDEBundleInjectionFramework IDEBundleInjection.framework product bundle
 @return builder
 */
- (instancetype)withIDEBundleInjectionFramework:(FBProductBundle *)IDEBundleInjectionFramework;

/**
 @required

 @param webDriverAgentTestBundle test bundle
 @return builder
 */
- (instancetype)withWebDriverAgentTestBundle:(FBTestBundle *)webDriverAgentTestBundle;

/**
 @return Prepared FBTestRunnerConfiguration
 */
- (FBTestRunnerConfiguration *)build;

@end
