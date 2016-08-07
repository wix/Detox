/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorConfiguration.h>

@class SimDevice;
@class SimDeviceType;
@class SimRuntime;

@protocol FBControlCoreConfiguration_Device;
@protocol FBControlCoreConfiguration_OS;

NS_ASSUME_NONNULL_BEGIN

/**
 Adapting FBSimulatorConfiguration to CoreSimulator.
 */
@interface FBSimulatorConfiguration (CoreSimulator)

#pragma mark Matching Configuration against Available Versions

/**
 Returns a new Simulator Configuration, for the newest available OS for given Device.

 @param device the Device to obtain the OS Configuration for
 @return the newest OS Configuration for the provided Device Configuration, or nil if none is available.
 */
+ (nullable id<FBControlCoreConfiguration_OS>)newestAvailableOSForDevice:(id<FBControlCoreConfiguration_Device>)device;

/**
 Returns a new Simulator Configuration, for the newest available OS for the current Device.
 This method will Assert if there is no available OS Version for the current Device.

 @return a Configuration with the OS Version Applied.
 */
- (instancetype)newestAvailableOS;

/**
 Returns a new Simulator Configuration, for the oldest available OS for given Device.

 @param device the Device to obtain the OS Configuration for
 @return the newest OS Configuration for the provided Device Configuration, or nil if none is available.
 */
+ (nullable id<FBControlCoreConfiguration_OS>)oldestAvailableOSForDevice:(id<FBControlCoreConfiguration_Device>)device;

/**
 Returns a new Simulator Configuration, for the oldest available OS for the current Device.
 This method will Assert if there is no available OS Version for the current Device.

 @return a Configuration with the OS Version Applied.
 */
- (instancetype)oldestAvailableOS;

/**
 Creates and returns a FBSimulatorConfiguration object that matches the provided device.

 @param device the Device to infer SimulatorConfiguration from.
 @param error any error that occurs in the inference of a configuration
 @return A FBSimulatorConfiguration object that matches the device.
 */
+ (instancetype)inferSimulatorConfigurationFromDevice:(SimDevice *)device error:(NSError **)error;

/**
 Confirms that the Runtime requirements for the reciever's configurations are met.
 Since it is possible to construct configurations for a wide range of Device Types & Runtimes,
 it may be the case the configuration represents an OS Version or Device that is unavaiable.

 Additionally, there are invalid OS Version to Device Type combinations that need to be checked at runtime.

 @param error an error out for any error that occurred.
 @return YES if the Runtime requirements are met, NO otherwise.
 */
- (BOOL)checkRuntimeRequirementsReturningError:(NSError **)error;

/**
 Returns an Array of all the Simulator Configurations that are available for the current environment.
 This means each available runtime is combined with each available device.
 */
+ (NSArray<FBSimulatorConfiguration *> *)allAvailableDefaultConfigurations;

#pragma mark Obtaining CoreSimulator Classes

/**
 Obtains the appropriate SimRuntime for a given configuration, or nil if no matching runtime is available.

 @param error an error out for any error that occurs.
 @return a SimRuntime if one could be obtained, nil otherwise.
 */
- (nullable SimRuntime *)obtainRuntimeWithError:(NSError **)error;

/**
 Obtains the appropriate SimDeviceType for a given configuration, or nil if no matching SimDeviceType is available.

 @param error an error out for any error that occurs.
 @return a SimDeviceType if one could be obtained, nil otherwise.
 */
- (nullable SimDeviceType *)obtainDeviceTypeWithError:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
