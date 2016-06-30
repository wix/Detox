/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBProductBundle;
@class FBTestBundle;
@class FBTestConfiguration;

@protocol FBCodesignProvider;
@protocol FBFileManager;

/**
 Represents application data package (.xcappdata) that containg all items needed to start xctest.
 This data package should be shiped with test runner application
 */
@interface FBApplicationDataPackage : NSObject

/**
 Path to data package
 */
@property (nonatomic, copy, readonly) NSString *path;

/**
 Path to bundle containing all needed items to start xctest
 */
@property (nonatomic, copy, readonly) NSString *bundlePath;

/**
 Path on device to bundle containing all needed items to start xctest
 */
@property (nonatomic, copy, readonly) NSString *bundlePathOnDevice;

/**
 Test configuration used to start tests
 */
@property (nonatomic, strong, readonly) FBTestConfiguration *testConfiguration;

/**
 Test bundle used for testing
 */
@property (nonatomic, strong, readonly) FBTestBundle *testBundle;

/**
 XCTest.framework
 */
@property (nonatomic, strong, readonly) FBProductBundle *XCTestFramework;

/**
 IDEBundleInjection.framework
 */
@property (nonatomic, strong, readonly) FBProductBundle *IDEBundleInjectionFramework;

@end


/**
 Prepares FBApplicationDataPackage by:
 - coping testBundle
 - preparing test configuration used to start tests
 - preparing XCTest.framework
 - preparing IDEBundleInjection.framework
 - codesigning all bundles with codesigner, if set
 */
@interface FBApplicationDataPackageBuilder : NSObject

/**
 @return builder that uses [NSFileManager defaultManager] as file manager
 */
+ (instancetype)builder;

/**
 @param fileManager a file manager used with builder
 @return builder
 */
+ (instancetype)builderWithFileManager:(id<FBFileManager>)fileManager;

/**
 @param packagePath path to prepared app data package
 @return builder
 */
- (instancetype)withPackagePath:(NSString *)packagePath;

/**
 @required

 @param testBundle test bundle used to create data package
 @return builder
 */
- (instancetype)withTestBundle:(FBTestBundle *)testBundle;

/**
 @required

 @param workingDirectory path to directory used to create application data package
 @return builder
 */
- (instancetype)withWorkingDirectory:(NSString *)workingDirectory;

/**
 @required

 @param deviceDataDirectory path to test runner application data container
 @return builder
 */
- (instancetype)withDeviceDataDirectory:(NSString *)deviceDataDirectory;

/**
 @required

 @param platformDirectory path to platform directory used to prepare test bundle
 @return builder
 */
- (instancetype)withPlatformDirectory:(NSString *)platformDirectory;

/**
 @param codesignProvider object used to codesign product bundle
 @return builder
 */
- (instancetype)withCodesignProvider:(id<FBCodesignProvider>)codesignProvider;

/**
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return prepared application data package if the operation succeeds, otherwise nil.
 */
- (FBApplicationDataPackage *)buildWithError:(NSError **)error;

@end
