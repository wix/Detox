/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBControlCore/FBProcessFetcher.h>

@class FBProcessInfo;
@class NSRunningApplication;

/**
 Higher-Level wrappers around FBProcessFetcher
 */
@interface FBProcessFetcher (Helpers)

/**
 A Query for obtaining all of the process information for a given processIdentifier, with a timeout.

 @param processIdentifier the Process Identifier to obtain process info for.
 @param timeout a timeout for finding the process information in.
 @return an FBProcessInfo object if a process with the given identifier could be found, nil otherwise.
 */
- (FBProcessInfo *)processInfoFor:(pid_t)processIdentifier timeout:(NSTimeInterval)timeout;

/**
 A that determines if the provided process is currently running.

 @param process the Process to look for
 @param error an error out for any error that occurs
 @return YES if a matching process is found, NO otherwise.
 */
- (BOOL)processExists:(FBProcessInfo *)process error:(NSError **)error;

/**
 Uses the reciever to poll for the termination of a process.

 @param process the process that is expected to terminate.
 @param timeout a timeout to wait for the process to die in.
 @return YES if the process has died, NO otherwise.
 */
- (BOOL)waitForProcessToDie:(FBProcessInfo *)process timeout:(NSTimeInterval)timeout;

/**
 Returns an Array of NSRunningApplications for the provided array of FBProcessInfo.

 @param processes the process to find the NSRunningApplication instances for.
 @return an NSArray<NSRunningApplication>. Any Applications that could not be found will be replaced with NSNull.null.
 */
- (NSArray *)runningApplicationsForProcesses:(NSArray *)processes;

/**
 Returns the NSRunningApplication for the provided FBProcessInfo *.

 @param process the application process to obtain the NSRunningApplication instance for.
 @return a FBProcessInfo for the running application, nil if one could not be found.
 */
- (NSRunningApplication *)runningApplicationForProcess:(FBProcessInfo *)process;

@end
