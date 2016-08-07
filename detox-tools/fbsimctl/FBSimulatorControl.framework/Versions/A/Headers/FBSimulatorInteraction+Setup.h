/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorInteraction.h>

@class FBSimulatorLaunchConfiguration;

NS_ASSUME_NONNULL_BEGIN

/**
 Interactions for Simulators that should occur Prior to the launch of the Simulator.
 */
@interface FBSimulatorInteraction (Setup)

/**
 Prepares the Simulator for Launch:
 - Sets the Locale (if set)
 - Sets up the keyboard.

 @param configuration the configuration to use.
 @return the reciever, for chaining.
 */
- (instancetype)prepareForLaunch:(FBSimulatorLaunchConfiguration *)configuration;

/**
 Overrides the Global Localization of the Simulator.

 @param localizationOverride the Localization Override to set.
 @return the reciever, for chaining.
 */
- (instancetype)overridingLocalization:(FBLocalizationOverride *)localizationOverride;

/**
 Authorizes the Location Settings for the provided bundleIDs

 @param bundleIDs an NSArray<NSString> of bundle IDs to to authorize location settings for.
 @return the reciever, for chaining.
 */
- (instancetype)authorizeLocationSettings:(NSArray<NSString *> *)bundleIDs;

/**
 Authorizes the Location Settings for the provided application.

 @param application the Application to authorize settings for.
 @return the reciever, for chaining.
 */
- (instancetype)authorizeLocationSettingForApplication:(FBApplicationDescriptor *)application;

/**
 Overrides the default SpringBoard watchdog timer for the applications. You can use this to give your application more
 time to startup before being killed by SpringBoard. (SB's default is 20 seconds.)

 @param bundleIDs The bundle IDs of the applications to override.
 @param timeout The new startup timeout.
 @return the receiver, for chaining.
 */
- (instancetype)overrideWatchDogTimerForApplications:(NSArray<NSString *> *)bundleIDs withTimeout:(NSTimeInterval)timeout;

/**
 Prepares the Simulator Keyboard, prior to launch.
 1) Disables Caps Lock
 2) Disables Auto Capitalize
 3) Disables Auto Correction / QuickType

 @return the reciever, for chaining.
 */
- (instancetype)setupKeyboard;

@end

NS_ASSUME_NONNULL_END
