/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBProcessFetcher;
@class FBProcessInfo;
@class FBSimulator;
@class FBSimulatorControlConfiguration;
@class SimDevice;

/**
 A Typedef for a SimDevice Callback.
 */
typedef void (^FBSimDeviceWrapperCallback)(void);

/**
 Augments methods in CoreSimulator with:
 - More informative return values.
 - Implementations that are more resiliant to failure in CoreSimulator.
 - Annotations of the expected arguments and return types of CoreSimulator.
 */
@interface FBSimDeviceWrapper : NSObject

/**
 Creates a SimDevice Wrapper.

 @param simulator the Simulator to wrap
 @param configuration the Simulator Control Configuration.
 @param processFetcher the Process Query to obtain process information.
 @return a new SimDevice wrapper.
 */
+ (instancetype)withSimulator:(FBSimulator *)simulator configuration:(FBSimulatorControlConfiguration *)configuration processFetcher:(FBProcessFetcher *)processFetcher;

/**
 'Shutting Down' a Simulator can be a little hairier than just calling '-[SimDevice shutdownWithError:]'.
 This method of shutting down takes into account a variety of error states and attempts to recover from them.

 Note that 'Shutting Down' a Simulator is different to 'terminating' or 'killing':
 - Killing a Simulator will kill the Simulator.app process.
 - Killing the Simulator.app process will soon-after get the SimDevice into a 'Shutdown' state in CoreSimulator.
 - This will take a number of seconds and represents an inconsistent state for the Simulator.
 - Calling Shutdown on a Simulator without terminating the Simulator.app process first will result in a 'Zombie' Simulator.
 - A 'Zombie' Simulator.app is a Simulator that isn't backed by a running SimDevice in CoreSimulator.

 Therefore this method should be called if:
 - A Simulator has no corresponding 'Simulator.app'. This is the case if `-[SimDevice bootWithOptions:error]` has been called directly.
 - After Simulator's corresponding 'Simulator.app' has been killed.

 @param error a descriptive error for any error that occurred.
 @return YES if successful, NO otherwise.
 */
- (BOOL)shutdownWithError:(NSError **)error;

/**
 Installs an Application on the Simulator.
 Will time out with an error if CoreSimulator gets stuck in a semaphore and timeout resiliance is enabled.

 @param appURL the Application URL to use.
 @param options the Options to use in the launch.
 @param error an error out for any error that occured.
 @return YES if the Application was installed successfully, NO otherwise.
 */
- (BOOL)installApplication:(NSURL *)appURL withOptions:(NSDictionary *)options error:(NSError **)error;

/**
 Uninstalls an Application on the Simulator.

 @param bundleID the Bundle ID of the Application to uninstall.
 @param options the Options to use in the launch.
 @param error an error out for any error that occured.
 @return YES if the Application was installed successfully, NO otherwise.
 */
- (BOOL)uninstallApplication:(NSString *)bundleID withOptions:(NSDictionary *)options error:(NSError **)error;

/**
 Spawns an long-lived executable on the Simulator.
 The Task should not terminate in less than a few seconds, as Process Info will be obtained.

 @param launchPath the path to the binary.
 @param options the Options to use in the launch.
 @param terminationHandler a Termination Handler for when the process dies.
 @param error an error out for any error that occured.
 @return the Process Identifier of the launched process, -1 otherwise.
 */
- (FBProcessInfo *)spawnLongRunningWithPath:(NSString *)launchPath options:(NSDictionary *)options terminationHandler:(FBSimDeviceWrapperCallback)terminationHandler error:(NSError **)error;

/**
 Spawns an short-lived executable on the Simulator.
 The Process Identifier of the task will be returned, but will be invalid by the time it is returned if the process is short-lived.
 Will block for timeout seconds to confirm that the process terminates

 @param launchPath the path to the binary.
 @param options the Options to use in the launch.
 @param timeout the number of seconds to wait for the process to terminate.
 @param error an error out for any error that occured.
 @return the Process Identifier of the launched process, -1 otherwise.
 */
- (pid_t)spawnShortRunningWithPath:(NSString *)launchPath options:(NSDictionary *)options timeout:(NSTimeInterval)timeout error:(NSError **)error;

/**
 Adds a Video to the Camera Roll.
 Will polyfill to the 'Camera App Upload' hack.

 @param paths an Array of paths of videos to upload.
 @return YES if the upload was successful, NO otherwise.
 */
- (BOOL)addVideos:(NSArray *)paths error:(NSError **)error;

@end
