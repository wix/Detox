/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBProcessLaunchConfiguration.h>

@class FBLocalizationOverride;
@class FBSimulator;

NS_ASSUME_NONNULL_BEGIN

/**
 Helpers for Application & Agent Launches.
 */
@interface FBProcessLaunchConfiguration (Helpers)

/**
 Adds Environment to the Launch Configuration

 @param environmentAdditions the Environment to Add. Must be an NSDictionary<NSString *, NSString*>>
 @return a new Launch Configuration with the Environment Applied.
 */
- (instancetype)withEnvironmentAdditions:(NSDictionary<NSString *, NSString *> *)environmentAdditions;

/**
 Appends Arguments to the Launch Configuration

 @param arguments the arguments to append.
 @return a new Launch Configuration with the Arguments Applied.
 */
- (instancetype)withAdditionalArguments:(NSArray<NSString *> *)arguments;

/**
 Adds Diagnostic Environment information to the reciever's environment configuration.

 @return a new Launch Configuration with the Diagnostic Environment Applied.
 */
- (instancetype)withDiagnosticEnvironment;

/**
 Uses DYLD_INSERT_LIBRARIES to inject a dylib into the launched application's process.

 @param filePath the File Path to the Dynamic Library. Must not be nil.
 */
- (instancetype)injectingLibrary:(NSString *)filePath;

/**
 Injects the Shimulator Dylib into the launched process;
 */
- (instancetype)injectingShimulator;

/**
 Creates the Dictionary of launch options for launching an Agent.

 @param stdOut the stdout to use, may be nil.
 @param stdErr the stderr to use, may be nil.
 @return a Dictionary if successful, nil otherwise.
 */
- (NSDictionary *)simDeviceLaunchOptionsWithStdOut:(nullable NSFileHandle *)stdOut stdErr:(nullable NSFileHandle *)stdErr;

/**
 A Name used to distinguish between Launch Configurations.
 */
- (NSString *)identifiableName;

@end

/**
 Helpers for Application Launches.
 */
@interface FBApplicationLaunchConfiguration (Helpers)

/**
 Overrides the launch of the Application with a given localization.

 @param localizationOverride the Localization Override to Apply.s
 */
- (instancetype)overridingLocalization:(FBLocalizationOverride *)localizationOverride;

@end

NS_ASSUME_NONNULL_END
