/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorInteraction.h>

NS_ASSUME_NONNULL_BEGIN

@class FBApplicationLaunchConfiguration;

@interface FBSimulatorInteraction (Applications)

/**
 Installs the given Application.
 Will always succeed if the Application is a System Application.

 @param application the Application to Install.
 @return the reciever, for chaining.
 */
- (instancetype)installApplication:(FBApplicationDescriptor *)application;

/**
 Uninstalls the given Application.
 Will always fail if the Application is a System Application.

 @param bundleID the Bundle ID of the application to uninstall.
 @return the reciever, for chaining.
 */
- (instancetype)uninstallApplicationWithBundleID:(NSString *)bundleID;

/**
 Launches the Application with the given Configuration.
 If the Application is determined to allready be running, the interaction will fail.

 @param appLaunch the Application Launch Configuration to Launch.
 @return the reciever, for chaining.
 */
- (instancetype)launchApplication:(FBApplicationLaunchConfiguration *)appLaunch;

/**
 Launches the Application with the given Configuration, or Re-Launches it.
 A Relaunch is a kill of the currently launched application, followed by a launch.

 @param appLaunch the Application Launch Configuration to Launch.
 @return the reciever, for chaining.
 */
- (instancetype)launchOrRelaunchApplication:(FBApplicationLaunchConfiguration *)appLaunch;

/**
 Terminates an Application based on the Application.
 Will fail if a running Application could not be found, or the kill fails.

 @param application the Application to terminate.
 @return the reciever, for chaining.
 */
- (instancetype)terminateApplication:(FBApplicationDescriptor *)application;

/**
 Terminates an Application based on the Bundle ID.
 Will fail if a running Application for the Bundle ID could not be found, or the kill fails.

 @param bundleID the bundle ID of the Application to Terminate.
 @return the reciever, for chaining.
 */
- (instancetype)terminateApplicationWithBundleID:(NSString *)bundleID;

/**
 Relaunches the last-launched Application:
 - If the Application is running, it will be killed first then launched.
 - If the Application has terminated, it will be launched.
 - If no Application has been launched yet, the interaction will fail.

 @return the reciever, for chaining.
 */
- (instancetype)relaunchLastLaunchedApplication;

/**
 Terminates the last-launched Application:
 - If the Application is running, it will be killed first then launched.
 - If the Application has terminated, the interaction will fail.
 - If no Application has been launched yet, the interaction will fail.

 @return the reciever, for chaining.
 */
- (instancetype)terminateLastLaunchedApplication;

@end

NS_ASSUME_NONNULL_END
