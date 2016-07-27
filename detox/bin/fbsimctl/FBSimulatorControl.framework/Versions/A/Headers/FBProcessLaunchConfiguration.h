/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBControlCore.h>

@class FBSimulator;
@class FBSimulatorApplication;
@class FBSimulatorBinary;

NS_ASSUME_NONNULL_BEGIN

/**
 Options for the Launch of Processes.
 */
typedef NS_OPTIONS(NSUInteger, FBProcessLaunchOptions) {
  FBProcessLaunchOptionsWriteStdout = 1 << 1, /** Writes the stdout of the launched process to a file. */
  FBProcessLaunchOptionsWriteStderr = 1 << 2, /** Writes the stderr of the launched process to a file. */
};

/**
 An abstract value object for launching both agents and applications
 */
@interface FBProcessLaunchConfiguration : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBDebugDescribeable>

/**
 An NSArray<NSString *> of arguments to the process. Will not be nil.
 */
@property (nonatomic, copy, readonly) NSArray<NSString *> *arguments;

/**
 A NSDictionary<NSString *, NSString *> of the Environment of the launched Application process. Will not be nil.
 */
@property (nonatomic, copy, readonly) NSDictionary<NSString *, NSString *> *environment;

/**
 The option set for launching Applications.
 */
@property (nonatomic, assign, readonly) FBProcessLaunchOptions options;

@end

/**
 A Value object with the information required to launch an Application.
 */
@interface FBApplicationLaunchConfiguration : FBProcessLaunchConfiguration <FBJSONDeserializable>

/**
 Creates and returns a new Configuration with the provided parameters.

 @param application the Application to Launch.
 @param arguments an NSArray<NSString *> of arguments to the process. Must not be nil.
 @param environment a NSDictionary<NSString *, NSString *> of the Environment of the launched Application process. Must not be nil.
 @param options the options of the launched process.
 @returns a new Configuration Object with the arguments applied.
 */
+ (instancetype)configurationWithApplication:(FBSimulatorApplication *)application arguments:(NSArray<NSString *> *)arguments environment:(NSDictionary<NSString *, NSString *> *)environment options:(FBProcessLaunchOptions)options;

/**
 Creates and returns a new Configuration with the provided parameters.

 @param bundleID the Bundle ID (CFBundleIdentifier) of the App to Launch. Must not be nil.
 @param bundleName the BundleName (CFBundleName) of the App to Launch. May be nil.
 @param arguments an NSArray<NSString *> of arguments to the process. Must not be nil.
 @param environment a NSDictionary<NSString *, NSString *> of the Environment of the launched Application process. Must not be nil.
 @param options the options of the launched process.
 @returns a new Configuration Object with the arguments applied.
 */
+ (instancetype)configurationWithBundleID:(NSString *)bundleID bundleName:(nullable NSString *)bundleName arguments:(NSArray<NSString *> *)arguments environment:(NSDictionary<NSString *, NSString *> *)environment options:(FBProcessLaunchOptions)options;

/**
 The Bundle ID (CFBundleIdentifier) of the the Application to Launch. Will not be nil.
 */
@property (nonnull, nonatomic, copy, readonly) NSString *bundleID;

/**
 The Name (CFBundleName) of the the Application to Launch. May be nil.
 */
@property (nullable, nonatomic, copy, readonly) NSString *bundleName;

@end

/**
 A Value object with the information required to launch a Binary Agent.
 */
@interface FBAgentLaunchConfiguration : FBProcessLaunchConfiguration <FBJSONDeserializable>

/**
 Creates and returns a new Configuration with the provided parameters

 @param agentBinary the Binary Path of the agent to Launch. Must not be nil.
 @param arguments an array-of-strings of arguments to the process. Must not be nil.
 @param environment a Dictionary, mapping Strings to Strings of the Environment to set in the launched Application process. Must not be nil.
 @param options the options of the launched process.
 @returns a new Configuration Object with the arguments applied.
 */
+ (instancetype)configurationWithBinary:(FBSimulatorBinary *)agentBinary arguments:(NSArray<NSString *> *)arguments environment:(NSDictionary<NSString *, NSString *> *)environment options:(FBProcessLaunchOptions)options;

/**
 The Binary Path of the agent to Launch.
 */
@property (nonatomic, copy, readonly) FBSimulatorBinary *agentBinary;

@end

NS_ASSUME_NONNULL_END
