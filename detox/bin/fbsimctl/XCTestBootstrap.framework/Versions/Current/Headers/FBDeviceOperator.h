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

@class DTXTransport;
@class DVTAbstractiOSDevice;
@class FBProductBundle;
@class FBTestRunnerConfiguration;

/**
 Operators are used to control devices
 */
@protocol FBDeviceOperator <NSObject, FBApplicationCommands>

/**
 Determines whether device supports testing with test manager daemon
 */
@property (nonatomic, assign, readonly) BOOL requiresTestDaemonMediationForTestHostConnection;

/**
 Starts test manager daemon and creates DTXTransport connection with it

 @param logger the Logger to Log to.
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return DTXTransport if the operation succeeds, otherwise nil.
 */
- (DTXTransport *)makeTransportForTestManagerServiceWithLogger:(id<FBControlCoreLogger>)logger error:(NSError **)error;

/**
 Waits for device to become ready. (eg. unlocked, loaded, available console data)

 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return YES if the operation succeeds, otherwise NO.
 */
- (BOOL)waitForDeviceToBecomeAvailableWithError:(NSError **)error;

/**
 Queries application with given bundleID

 @param bundleID bundle ID of queried application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return applicationBundle if application is installed, otherwise nil
 */
- (FBProductBundle *)applicationBundleWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Launches application with given bundleID, arguments & environment variables

 @param bundleID bundle ID of installed application
 @param arguments arguments used to launch application
 @param environment environment variables used to launch application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return YES if the operation succeeds, otherwise NO.
 */
- (BOOL)launchApplicationWithBundleID:(NSString *)bundleID arguments:(NSArray *)arguments environment:(NSDictionary *)environment error:(NSError **)error;

/**
 Kills application with given bundleID

 @param bundleID bundle ID of installed application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return YES if the operation succeeds, otherwise NO.
 */
- (BOOL)killApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Returns PID of application with given bundleID

 @param bundleID bundle ID of installed application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return PID of application, or 0 if not running
 */
- (pid_t)processIDWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Removes apllication with given bundleID and it's data

 @param bundleID bundle ID of installed application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return YES if the operation succeeds, otherwise NO.
 */
- (BOOL)cleanApplicationStateWithBundleIdentifier:(NSString *)bundleID error:(NSError **)error;

/**
 Returns application path for application with given bundleID

 @param bundleID bundle ID of installed application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return application path on device
 */
- (NSString *)applicationPathForApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Uploads application data for application with given bundleID

 @param path path to data package file (.xcappdata)
 @param bundleID bundle ID of installed application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return YES if the operation succeeds, otherwise NO.
 */
- (BOOL)uploadApplicationDataAtPath:(NSString *)path bundleID:(NSString *)bundleID error:(NSError **)error;

/**
 Returns application data container path for application with given bundleID

 @param bundleID bundle ID of installed application
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return application data container path
 */
- (NSString *)containerPathForApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

/**
 @return Console entries on device
 */
- (NSString *)consoleString;

@end
