/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@protocol FBControlCoreLogger;
@class FBProcessFetcher;
@class FBProcessInfo;

/**
 An Option Set for Process Termination.
 */
typedef NS_ENUM(NSUInteger, FBProcessTerminationStrategyOptions) {
  FBProcessTerminationStrategyOptionsUseNSRunningApplication = 1 << 1, /** Use -[NSRunningApplication terminate] where relevant **/
  FBProcessTerminationStrategyOptionsCheckProcessExistsBeforeSignal = 1 << 2, /** Checks for the process to exist before signalling **/
  FBProcessTerminationStrategyOptionsCheckDeathAfterSignal = 1 << 3, /** Waits for the process to die before returning **/
  FBProcessTerminationStrategyOptionsBackoffToSIGKILL = 1 << 4, /** Whether to backoff to SIGKILL if a less severe signal fails **/
};

/**
 A Configuration for the Strategy.
 */
typedef struct {
  int signo;
  FBProcessTerminationStrategyOptions options;
} FBProcessTerminationStrategyConfiguration;

NS_ASSUME_NONNULL_BEGIN

/**
 A Strategy that defines how to terminate Processes.
 */
@interface FBProcessTerminationStrategy : NSObject

/**
 Creates and returns a strategy for the given configuration.

 @param configuration the configuration to use in the strategy.
 @param processFetcher the Process Query object to use.
 @param logger the logger to use.
 @return a new Process Termination Strategy instance.
 */
+ (instancetype)withConfiguration:(FBProcessTerminationStrategyConfiguration)configuration processFetcher:(FBProcessFetcher *)processFetcher logger:(id<FBControlCoreLogger>)logger;

/**
 Creates and returns a strategy with the default configuration.

 @param processFetcher the Process Query object to use.
 @param logger the logger to use.
 @return a new Process Termination Strategy instance.
 */
+ (instancetype)withProcessFetcher:(FBProcessFetcher *)processFetcher logger:(id<FBControlCoreLogger>)logger;

/**
 Terminates a Process of the provided Process Info.

 @param process the process to terminate, must not be nil.
 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
- (BOOL)killProcess:(FBProcessInfo *)process error:(NSError **)error;

/**
 Terminates a number of Processes of the provided Process Info Array.

 @param processes an NSArray<FBProcessInfo> of processes to terminate.
 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
- (BOOL)killProcesses:(NSArray<FBProcessInfo *> *)processes error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
