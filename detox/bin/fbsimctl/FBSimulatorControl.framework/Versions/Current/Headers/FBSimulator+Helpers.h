/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulator.h>

@class FBApplicationDescriptor ;
@class FBSimDeviceWrapper;
@class FBSimulatorInteraction;
@class FBSimulatorLaunchCtl;

NS_ASSUME_NONNULL_BEGIN

/**
 Helper Methods & Properties for FBSimulator.
 */
@interface FBSimulator (Helpers)

#pragma mark Properties

/**
 Creates an FBSimulatorInteraction for the reciever.
 */
@property (nonatomic, strong, readonly) FBSimulatorInteraction *interact;

/**
 Creates a FBSimDeviceWrapper for the Simulator.
 */
@property (nonatomic, strong, readonly) FBSimDeviceWrapper *simDeviceWrapper;

/**
 Creates a FBSimulatorLaunchCtl for the Simulator.
 */
@property (nonatomic, strong, readonly) FBSimulatorLaunchCtl *launchctl;

/**
 The DeviceSetPath of the Simulator.
 */
@property (nonatomic, nullable, copy, readonly) NSString *deviceSetPath;

/*
 Fetches an NSArray<FBProcessInfo *> of the subprocesses of the launchd_sim.
 */
@property (nonatomic, copy, readonly) NSArray<FBProcessInfo *> *launchdSimSubprocesses;

/**
 Fetches a list of the installed applications=
 */
@property (nonatomic, copy, readonly) NSArray<FBApplicationDescriptor *> *installedApplications;

#pragma mark Methods

/**
 Convenience method for obtaining SimulatorState from a String.

 @param stateString the State String to convert from
 @return an Enumerated State for the String.
 */
+ (FBSimulatorState)simulatorStateFromStateString:(NSString *)stateString;

/**
 Convenience method for obtaining a description of Simulator State

 @param state the Enumerated State to convert from.
 @return a String Representation of the Simulator State.
 */
+ (NSString *)stateStringFromSimulatorState:(FBSimulatorState)state;

/**
 Synchronously waits on the provided state.

 @param state the state to wait on
 @returns YES if the Simulator transitioned to the given state with the default timeout, NO otherwise
 */
- (BOOL)waitOnState:(FBSimulatorState)state;

/**
 Synchronously waits on the provided state.

 @param state the state to wait on
 @param timeout timeout
 @returns YES if the Simulator transitioned to the given state with the timeout, NO otherwise
 */
- (BOOL)waitOnState:(FBSimulatorState)state timeout:(NSTimeInterval)timeout;

/**
 A Synchronous wait, with a default timeout, producing a meaningful error message.

 @param state the state to wait on
 @param error an error out for a timeout error if one occurred
 @returns YES if the Simulator transitioned to the given state with the timeout, NO otherwise
 */
- (BOOL)waitOnState:(FBSimulatorState)state withError:(NSError **)error;

/**
 Calls `freeSimulator:error:` on this device's pool, with the reciever as the first argument.

 @param error an error out for any error that occured.
 @returns YES if the freeing of the device was successful, NO otherwise.
 */
- (BOOL)freeFromPoolWithError:(NSError **)error;

/**
 Erases the Simulator, with a descriptive message in the event of a failure.

 @param error a descriptive error for any error that occurred.
 @return YES if successful, NO otherwise.
 */
- (BOOL)eraseWithError:(NSError **)error;

/**
 Fetches the FBApplicationDescriptor instance by Bundle ID, on the Simulator.

 @param bundleID the Bundle ID to fetch an installed application for.
 @param error an error out for any error that occurs.
 @return a FBApplicationDescriptor instance if one could be obtained, nil otherwise.
 */
- (nullable FBApplicationDescriptor *)installedApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Determines whether a provided Bundle ID represents a System Application

 @param bundleID the Bundle ID to fetch an installed application for.
 @param error an error out for any error that occurs.
 @return YES if the Application with the provided is a System Application, NO otherwise.
*/
- (BOOL)isSystemApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Determines the location of the Home Directory of an Application, it's chroot jail.

 @param bundleID the Bundle ID of the Application to search for,.
 @param error an error out for any error that occurs.
 @return the Home Directory of the Application if one was found, nil otherwise.
 */
- (nullable NSString *)homeDirectoryOfApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Returns the Process Info for a Application by Bundle ID.

 @param bundleID the Bundle ID to fetch an installed application for.
 @param error an error out for any error that occurs.
 @return An FBProcessInfo for the Application if one is running, nil otherwise.
 */
- (nullable FBProcessInfo *)runningApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

/*
 A Set of process names that are used to determine whether all the Simulator OS services
 have been launched after booting.

 There is a period of time between when CoreSimulator says that the Simulator is 'Booted'
 and when it is stable enough state to launch Applications/Daemons, these Service Names
 represent the Services that are known to signify readyness.

 @return the required process names.
 */
- (NSSet<NSString *> *)requiredProcessNamesToVerifyBooted;

@end

NS_ASSUME_NONNULL_END
