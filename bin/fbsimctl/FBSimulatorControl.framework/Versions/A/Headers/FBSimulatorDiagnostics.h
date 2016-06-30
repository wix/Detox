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

#import <FBSimulatorControl/FBSimulatorEventSink.h>

@class FBDiagnostic;
@class FBDiagnosticBuilder;
@class FBSimulator;

NS_ASSUME_NONNULL_BEGIN

/**
 The Name of the Syslog.
 */
extern NSString *const FBSimulatorLogNameSyslog;

/**
 The Name of the Core Simulator Log.
 */
extern NSString *const FBSimulatorLogNameCoreSimulator;

/**
 The Name of the Simulator Bootstrap.
 */
extern NSString *const FBSimulatorLogNameSimulatorBootstrap;

/**
 The Name of the Video Log
 */
extern NSString *const FBSimulatorLogNameVideo;

/**
 The Name of the Screenshot Log.
 */
extern NSString *const FBSimulatorLogNameScreenshot;

/**
 Exposes Simulator Logs & Diagnsotics as FBDiagnostic instances.

 Instances of FBDiagnostic exposed by this class are not nullable since FBDiagnostic's can be empty:
 - This means that values do not have to be checked before storing in collections
 - Missing content can be inserted into the FBDiagnostic instances, whilst retaining the original metadata.
 */
@interface FBSimulatorDiagnostics : NSObject <FBSimulatorEventSink>

/**
 Creates and returns a `FBSimulatorDiagnostics` instance.

 @param simulator the Simulator to Fetch logs for.
 @return A new `FBSimulatorDiagnostics` instance for the provided Simulator.
 */
+ (instancetype)withSimulator:(FBSimulator *)simulator;

#pragma mark Paths

/**
 The directory path of the expected location of the CoreSimulator logs directory.
 */
- (NSString *)coreSimulatorLogsDirectory;

#pragma mark Diagnostic Accessors

/**
 The FBDiagnostic Instance from which all other logs are derived.
 */
- (FBDiagnostic *)base;

/**
 The syslog of the Simulator.
 */
- (FBDiagnostic *)syslog;

/**
 The Log for CoreSimulator.
 */
- (FBDiagnostic *)coreSimulator;

/**
 The Bootstrap of the Simulator's launchd_sim.
 */
- (FBDiagnostic *)simulatorBootstrap;

/**
 A Video of the Simulator
 */
- (FBDiagnostic *)video;

/**
 A Screenshot of the Simulator.
 */
- (FBDiagnostic *)screenshot;

/**
 The 'stdout' diagnostic for a provided Application.
 */
- (FBDiagnostic *)stdOut:(FBProcessLaunchConfiguration *)configuration;

/**
 The 'stderr' diagnostic for a provided Application.
 */
- (FBDiagnostic *)stdErr:(FBProcessLaunchConfiguration *)configuration;

/**
 An Array of all non-empty stderr and stdout logs for launched processes.
 */
- (NSArray<FBDiagnostic *> *)stdOutErrDiagnostics;

/**
 Crash logs of all the subprocesses that have crashed in the Simulator after the specified date.

 @param date the earliest to search for crash reports. If nil will find reports regardless of date.
 @param processType an Option Set for the kinds of crashes that should be fetched.
 @return an NSArray<FBDiagnostic *> of all the applicable crash reports.
 */
- (NSArray<FBDiagnostic *> *)subprocessCrashesAfterDate:(NSDate *)date withProcessType:(FBCrashLogInfoProcessType)processType;

/**
 Crashes that occured in the Simulator since the last booting of the Simulator.

 @return an NSArray<FBDiagnostic *> of crashes that occured for user processes since the last boot.
 */
- (NSArray<FBDiagnostic *> *)userLaunchedProcessCrashesSinceLastLaunch;

/**
 The System Log, filtered and bucketed for each process that was launched by the user.

 @return an NSDictionary<FBProcessInfo *, FBDiagnostic> of the logs, filtered by launched process.
 */
- (NSDictionary<FBProcessInfo *, FBDiagnostic *> *)launchedProcessLogs;

/**
 Fetches Diagnostics inside Application Containers.
 Looks inside the Home Directory of the Application.

 @param bundleID the Appliction to search for by Bundle ID. May be nil.
 @param filenames the Filenames of the Diagnostics to search for. Must not be nil.
 @param globalFallback if YES, the entire Simulator will be searched in the event that the Application's Home Directory cannot be found.
 @return an Dictionary of all the successfully found diagnostics.
 */
- (NSArray<FBDiagnostic *> *)diagnosticsForApplicationWithBundleID:(nullable NSString *)bundleID withFilenames:(NSArray<NSString *> *)filenames fallbackToGlobalSearch:(BOOL)globalFallback;

/**
 All of the FBDiagnostic instances for the Simulator.
 Prunes empty logs.

 @return an NSArray<FBDiagnostic> of all the Diagnostics associated with the Simulator.
 */
- (NSArray<FBDiagnostic *> *)allDiagnostics;

/**
 All of the FBDiagnostic instances for the Simulator, bucketed by diagnostic name.
 Prunes empty and unnamed logs

 @return a dictionary mapping diagnostic names to diagnostics.
 */
- (NSDictionary<NSString *, FBDiagnostic *> *)namedDiagnostics;

@end

NS_ASSUME_NONNULL_END
