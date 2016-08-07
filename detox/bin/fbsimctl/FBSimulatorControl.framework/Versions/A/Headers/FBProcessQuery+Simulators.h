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

@class FBProcessInfo;
@class FBSimulatorBinary;
@class FBSimulatorControlConfiguration;
@class SimDevice;

/**
 An Environment Variable that is inserted into launched Simulator.app processes
 in order to easily identify the Simulator UUID that they were launched to run against.
 */
extern NSString *const FBSimulatorControlSimulatorLaunchEnvironmentSimulatorUDID;


/**
 Extension for obtaining Simulator Process information.
 */
@interface FBProcessQuery (Simulators)

#pragma mark Process Fetching

/**
 Fetches an NSArray<FBProcessInfo *> of all Simulator Application Processes.
 */
- (NSArray *)simulatorProcesses;

/**
 Fetches an NSArray<FBProcessInfo *> of all com.apple.CoreSimulator.CoreSimulatorService.
 */
- (NSArray *)coreSimulatorServiceProcesses;

/**
 Fetches an NSArray<FBProcessInfo *> of all launchd_sim processes.
 */
- (NSArray *)launchdSimProcesses;

/**
 Fetches the Process Info for a given Simulator.

 @param simDevice the Simulator to fetch Process Info for.
 @return Application Process Info if any could be obtained, nil otherwise.
 */
- (FBProcessInfo *)simulatorApplicationProcessForSimDevice:(SimDevice *)simDevice;

/**
 Fetches the Process Info for a given Simulator, with a timeout as the process info may take a while to appear

 @param simDevice the Simulator to fetch Process Info for.
 @param timeout the time to wait for the process info to appear.
 @return Application Process Info if any could be obtained, nil otherwise.
 */
- (FBProcessInfo *)simulatorApplicationProcessForSimDevice:(SimDevice *)simDevice timeout:(NSTimeInterval)timeout;

/**
 Fetches the Process Info for a given Simulator's launchd_sim.

 @param simDevice the Simulator to fetch Process Info for.
 @return Process Info if any could be obtained, nil otherwise.
 */
- (FBProcessInfo *)launchdSimProcessForSimDevice:(SimDevice *)simDevice;

#pragma mark Predicates

/**
 Returns a Predicate that matches simulator processes only from the Xcode version in the provided configuration.

 @param configuration the configuration to match against.
 @return an NSPredicate that operates on an Collection of FBProcessInfo *.
 */
+ (NSPredicate *)simulatorsProcessesLaunchedUnderConfiguration:(FBSimulatorControlConfiguration *)configuration;

/**
 Returns a Predicate that matches simulator processes launched by FBSimulatorControl

 @return an NSPredicate that operates on an Collection of FBProcessInfo *.
 */
+ (NSPredicate *)simulatorProcessesLaunchedBySimulatorControl;

/**
 Constructs a Predicate that matches Process Info for Simulator Applications for the given UDIDs.

 @param udids an NSArray<NSString *> of the Simulator UDIDs to match.
 @return an NSPredicate that operates on an Collection of FBProcessInfo *.
 */
+ (NSPredicate *)simulatorProcessesMatchingUDIDs:(NSArray *)udids;

/**
 Constructs a Predicate that matches Process Info for launchd_sim process for the given UDIDs.

 @param udids an NSArray<NSString *> of the Simulator UDIDs to match.
 @return an NSPredicate that operates on an Collection of FBProcessInfo *.
 */
+ (NSPredicate *)launchdSimProcessesMatchingUDIDs:(NSArray *)udids;

/**
 Constructs a Predicate that matches CoreSimulatorService Processes for the current xcode versions.

 @return an NSPredicate that operates on an Collection of FBProcessInfo *.
 */
+ (NSPredicate *)coreSimulatorProcessesForCurrentXcode;

/**
 Constructs a Predicate that matches Processes for the launchPath.

 @param launchPath the launch path to search for.
 @return an NSPredicate that operates on an Collection of FBProcessInfo *.
 */
+ (NSPredicate *)processesWithLaunchPath:(NSString *)launchPath;

/**
 Constructs a Predicate that matches against an Application.
 Installing an Application on a Simulator will result in it having a different launch path
 since the Application Bundle is moved into the Simulator's data directory.
 This predicate takes the discrepancy in launch paths into account.

 @param binary the binary of the Application to search for.
 @return an NSPredicate that operates on an Collection of id<FBProcessInfo>.
 */
+ (NSPredicate *)processesForBinary:(FBSimulatorBinary *)binary;

@end
