/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBTask.h>

/**
 Error Doman for all FBTaskExecutor errors
 */
extern NSString *const FBTaskExecutorErrorDomain;

/**
 An interface to building FBTask instances
 */
@protocol FBTaskBuilder <NSObject>

/**
 The Set of Return Codes that are considered non-erroneous.

 @param statusCodes the non-erroneous stats codes.
 @return a builder, with the arguments applied.
 */
- (instancetype)withAcceptableTerminationStatusCodes:(NSSet *)statusCodes;

/**
 The Launch Path of the Task. Will override any shell command set with `shellCommand`.

 @param launchPath the Launch Path. Will remove shellCommand.
 @return a builder, with the arguments applied.
 */
- (instancetype)withLaunchPath:(NSString *)launchPath;

/**
 The Arguments of the Task. Will override any shell command set with `shellCommand`.

 @param arguments the arguments for the launch path.
 @return a builder, with the arguments applied.
 */
- (instancetype)withArguments:(NSArray *)arguments;

/**
 Adds the provided dictionary to the environment of the built task.

 @param environment an Environment Dictionary of NSDictionary<NSString *, NSString *>
 @returns a builder, with the argument applied
 */
- (instancetype)withEnvironmentAdditions:(NSDictionary *)environment;

/**
 The Shell Command to execute. Will override any launch path or arguments set with `withArguments` or `withLaunchPath`.

 @param shellCommand the Shell Command to execute.
 @return a builder, with the arguments applied.
 */
- (instancetype)withShellTaskCommand:(NSString *)shellCommand;

/**
 Assigns a path for StdOut and StdErr for the built task.

 @param stdOutPath the path to write stdout to. Must not be nil.
 @param stdErrPath the path to write stderr to. May be nil.
 @returns a builder, with the arguments applied.
 */
- (instancetype)withStdOutPath:(NSString *)stdOutPath stdErrPath:(NSString *)stdErrPath;

/**
 Builds a Task that will write stdout and stderr to the heap when the task executes.

 @returns a builder, with the arguments applied.
 */
- (instancetype)withWritingInMemory;

/**
 Builds the Task

 @return a FBTask.
 */
- (id<FBTask>)build;

@end

/**
 Executes shell commands and return the results of standard output/error.
 */
@interface FBTaskExecutor : NSObject <FBTaskBuilder, NSCopying>

/**
 Returns the shared `FBTaskExecutor` instance.
 */
+ (instancetype)sharedInstance;

/**
 Creates a Task for execution.
 When the task is launched it will be retained until the task has terminated.
 Terminate must be called to free up resources.

 @param launchPath the Executable Path to launch.
 @param arguments the arguments to send to the launched tasks.
 @return a Task ready to be started.
 */
- (id<FBTask>)taskWithLaunchPath:(NSString *)launchPath arguments:(NSArray *)arguments;

/**
 Creates a Shell Command for execution. May be executed according to the `id<FBTask>` API.

 @param command the Shell Command to execute. File Paths must be quoted or escaped. Must not be nil.
 @return a Shell Task ready to be started.
 */
- (id<FBTask>)shellTask:(NSString *)command;

/**
 Escapes the given path, so that it can be placed into a shell command string.

 @param path the File Path to escape
 @return a shell-escaped file path
 */
+ (NSString *)escapePathForShell:(NSString *)path;

@end
