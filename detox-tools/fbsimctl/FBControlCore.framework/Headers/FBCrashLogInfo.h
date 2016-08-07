/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBDiagnostic;
@class FBDiagnosticBuilder;

/**
 The Process Type of the Crash Log
*/
typedef NS_OPTIONS(NSUInteger, FBCrashLogInfoProcessType) {
  FBCrashLogInfoProcessTypeSystem = 1 << 0, /** A Crash for a Simulator's System Application */
  FBCrashLogInfoProcessTypeApplication = 1 << 1, /** A Crash for an App in the Simulator **/
  FBCrashLogInfoProcessTypeCustomAgent = 1 << 2, /** A Crash for a Custom Launched Agent in the Simulator **/
};

/**
 Information about Crash Logs.
 */
@interface FBCrashLogInfo : NSObject <NSCopying>

/**
 The Path of the Crash Log.
 */
@property (nonatomic, copy, readonly) NSString *crashPath;

/**
 The Path of the Executable Image.
 */
@property (nonatomic, copy, readonly) NSString *executablePath;

/**
 The Name of the Crashed Process.
 */
@property (nonatomic, copy, readonly) NSString *processName;

/**
 The Process Identifier of the Crashed Process/
 */
@property (nonatomic, assign, readonly) pid_t processIdentifier;

/**
 The Process Name of the Crashed Process's parent.
 */
@property (nonatomic, copy, readonly) NSString *parentProcessName;

/**
 The Process Identifier of the Crashed Process's parent.
 */
@property (nonatomic, assign, readonly) pid_t parentProcessIdentifier;

/**
 The Process Type of the Crash Log
 */
@property (nonatomic, assign, readonly) FBCrashLogInfoProcessType processType;

/**
 Creates Crash Log Info from the specified crash log path.
 Returns nil on error.

 @param path the path to extract crash log info from.
 @return a Crash Log Info on success, nil otherwise.
 */
+ (instancetype)fromCrashLogAtPath:(NSString *)path;

/**
 Constructs a FBDiagnostic instance from the Crash Log.

 @param builder the builder to populate the Crash Log into.
 */
- (FBDiagnostic *)toDiagnostic:(FBDiagnosticBuilder *)builder;

@end
