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

@class FBSimulatorDiagnostics;

/**
 A Value object for searching for, and returning diagnostics.
 */
@interface FBSimulatorDiagnosticQuery : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBJSONDeserializable, FBDebugDescribeable>

#pragma mark Initializers

/**
 A Query for all diagnostics that match a given name.

 @param names the names to search for.
 @return a FBSimulatorDiagnosticQuery.
 */
+ (nonnull instancetype)named:(nonnull NSArray<NSString *> *)names;

/**
 A Query for all static diagnostics.

 @return a FBSimulatorDiagnosticQuery.
 */
+ (nonnull instancetype)all;

/**
 A Query for Diagnostics in an Application's Sandbox.

 @param bundleID the Application Bundle ID to search in.
 @param filenames the filenames to search for.
 @return a FBSimulatorDiagnosticQuery.
 */
+ (nonnull instancetype)filesInApplicationOfBundleID:(nonnull NSString *)bundleID withFilenames:(nonnull NSArray<NSString *> *)filenames;

/**
 A Query for Crashes of a Process Type, after a date.

 @param processType the Process Types to search for.
 @param date the date to search from.
 @return a FBSimulatorDiagnosticQuery.
 */
+ (nonnull instancetype)crashesOfType:(FBCrashLogInfoProcessType)processType since:(nonnull NSDate *)date;

#pragma mark Performing

/**
 Returns an array of the diagnostics that match the query.

 @param diagnostics the Simulator diagnostics object to fetch from.
 @return an Array of Diagnostics that match
 */
- (nonnull NSArray<FBDiagnostic *> *)perform:(nonnull FBSimulatorDiagnostics *)diagnostics;

@end
