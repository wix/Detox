/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@protocol FBControlCoreLogger;

NS_ASSUME_NONNULL_BEGIN

/**
 An Environment Variable: 'FBCONTROLCORE_LOGGING' to enable logging of Informational Messages to stderr.
 */
extern NSString *const FBControlCoreStderrLogging;

/**
 An Environment Variable: 'FBCONTROLCORE_DEBUG_LOGGING' to enable logging of Debug Messages to stderr.
 */
extern NSString *const FBControlCoreDebugLogging;

/**
 Environment Globals & other derived constants.
 These values can be accessed before the Private Frameworks are loaded.
 */
@interface FBControlCoreGlobalConfiguration : NSObject

/**
 The File Path to of Xcode's /Xcode.app/Contents/Developer directory.
 */
+ (NSString *)developerDirectory;

/**
 The File Path to of Xcode's Info.plist, defined by the Developer Directory.
 */
+ (NSString *)xcodeInfoPlistPath;

/**
 The File Path of Apple's 'Apple Configurator' Application, if installed.
 */
+ (nullable NSString *)appleConfiguratorApplicationPath;

/**
 The Version Number for the Xcode defined by the Developer Directory.
 */
+ (NSDecimalNumber *)xcodeVersionNumber;

/**
 The SDK Version for the Xcode defined by the Developer Directory.
 */
+ (NSDecimalNumber *)iosSDKVersionNumber;

/**
 Formatter for the SDK Version a string
 */
+ (NSNumberFormatter *)iosSDKVersionNumberFormatter;

/**
 The SDK Version of the current Xcode Version as a String.
 */
+ (NSString *)iosSDKVersion;

/**
 A Timeout Value when waiting on events that should happen 'fast'
 */
+ (NSTimeInterval)fastTimeout;

/**
 A Timeout Value when waiting on events that will take some time longer than 'fast' events.
 */
+ (NSTimeInterval)regularTimeout;

/**
 `regularTimeout` as a dispatch_time_t.
 */
+ (dispatch_time_t)regularDispatchTimeout;

/**
 A Timeout Value when waiting on events that will a longer period of time.
 */
+ (NSTimeInterval)slowTimeout;

/**
 YES if passing a custom SimDeviceSet to the Simulator App is Supported.
 */
+ (BOOL)supportsCustomDeviceSets;

/**
 YES if additional debug logging should be provided to the logger, NO otherwise.
 */
+ (BOOL)debugLoggingEnabled;

/**
 The default logger to send log messages to.
 */
+ (id<FBControlCoreLogger>)defaultLogger;

/**
 A Description of the Current Configuration.
 */
+ (NSString *)description;

@end

/**
 Updates the Global Configuration.
 These Methods should typically be called *before any other* method in FBControlCore.
 */
@interface FBControlCoreGlobalConfiguration (Setters)

/**
 This is provided as a global so that a custom logger can be provided to the Private Framework loader.

 @param logger the new default logger
 */
+ (void)setDefaultLogger:(id<FBControlCoreLogger>)logger;

/**
 Update the current process environment to enable logging to stderr.

 @param stderrLogging YES if stderr logging should be enabled, NO otherwise.
 @param debugLogging YES if stdout logging should be enabled, NO otherwise.
 */
+ (void)setDefaultLoggerToASLWithStderrLogging:(BOOL)stderrLogging debugLogging:(BOOL)debugLogging;

@end

NS_ASSUME_NONNULL_END
