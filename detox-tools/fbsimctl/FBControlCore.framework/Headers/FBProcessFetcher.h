/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBProcessInfo;

/**
 Queries for Processes running on the Host.
 Should not be called from multiple threads since buffers are re-used internally.

 Sharing a Query object and guaranteeing serialization of method calls
 can be an effective way to reduce the number of allocations that are required.
 */
@interface FBProcessFetcher : NSObject

/**
 A Query for obtaining all of the process information for a given processIdentifier.

 @param processIdentifier the Process Identifier to obtain process info for.
 @return an FBProcessInfo object if a process with the given identifier could be found, nil otherwise.
 */
- (FBProcessInfo *)processInfoFor:(pid_t)processIdentifier;

/**
 Obtain process info for child processes.

 @param parent the Process Identifier to obtain the subprocesses of
 @return an NSArray<FBProcessInfo> of the parent's child processes.
 */
- (NSArray *)subprocessesOf:(pid_t)parent;

/**
 A Query for returning processes with a given subtring in their launch path.

 @param substring the substring that must exist in the launch path.
 @return an NSArray<FBProcessInfo> of the found processes.
 */
- (NSArray *)processesWithLaunchPathSubstring:(NSString *)substring;

/**
 A Query for returning the processes with a given name.

 Note that this is more optimal than `processesWithLaunchPathSubstring:`
 since only the process name is fetched in the syscall.

 @param processName the name of the processes to fetch.
 @return an NSArray<FBProcessInfo> of the found processes.
 */
- (NSArray *)processesWithProcessName:(NSString *)processName;

/**
 A Query for returning the first named child process of the provided parent.

 @param parent the Process Identifier of the parent process.
 @param name the name of the child process.
 @return a Process Identifier of the child process if one could be found, -1 otherwise.
 */
- (pid_t)subprocessOf:(pid_t)parent withName:(NSString *)name;

/**
 A Query for returning the parent of the provided child process

 @param child the Process Identifier of the child process.
 @return a Process Identifier of the parent process if one could be found, -1 otherwise.
 */
- (pid_t)parentOf:(pid_t)child;

/**
 A Query for returning the process identifier of the first found process with an open file of filename.
 This is a operation is generally more expensive than the others.

 @param filePath the path to the file.
 @return a Process Identifier for the first process with an open file to the path, -1 otherwise.
 */
- (pid_t)processWithOpenFileTo:(const char *)filePath;

@end
