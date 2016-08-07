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
 Loads Frameworks that FBDeviceControl depends on.
 */
@interface FBDeviceControlFrameworkLoader : NSObject

#pragma mark Essential Frameworks

/**
 Loads the Private Frameworks that are essential for the basic operation of FBDeviceControl.
 Aborts if the loading fails.
 */
+ (void)initializeEssentialFrameworks;

/**
 Loads the Relevant Private Frameworks for ensuring the essential operation of FBDeviceControl.

 @param logger the logger to log to for Framework Loading activity.
 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
+ (BOOL)loadEssentialFrameworks:(id<FBControlCoreLogger>)logger error:(NSError **)error;

#pragma mark Xcode Frameworks

/**
 Loads the Private Frameworks that are necessary for the interaction of XCTest Targets with FBDeviceControl.
 Aborts if the loading fails.
 */
+ (void)initializeXCodeFrameworks;

/**
 Loads the Relevant Private Frameworks that are necessary for the interaction of XCTest Targets with FBDeviceControl.

 @param logger the logger to log to for Framework Loading activity.
 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
+ (BOOL)loadXcodeFrameworks:(id<FBControlCoreLogger>)logger error:(NSError **)error;

#pragma mark Verbose Logging

/**
 Raises the Log Level to debug for DVT relevant Private Frameworks.
 */
+ (void)enableDVTDebugLogging;

@end

NS_ASSUME_NONNULL_END
