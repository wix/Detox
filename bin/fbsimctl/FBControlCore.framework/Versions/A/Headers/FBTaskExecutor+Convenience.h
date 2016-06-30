/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBControlCore/FBTaskExecutor.h>

@interface FBTaskExecutor (Convenience)

/**
 @see executeShellCommand:returningError:
 */
- (NSString *)executeShellCommand:(NSString *)command;

/**
 Executes the given command using the shell and returns the result.
 The returned string has leading/trailing whitespace and new lines trimmed.
 Will error if the time taken to execute the command exceeds the default timeout.

 @param command The shell command to execute. File Paths must be quoted or escaped. Must not be nil.
 @param error NSError byref to be populated if an error occurs while executing the command. May be nil. Populates the userInfo with stdout.
 @return The stdout from the command. Returns nil if an Error occured.
 */
- (NSString *)executeShellCommand:(NSString *)command returningError:(NSError **)error;

/**
 Repeatedly runs the given command, passing the output to the block.
 When the block returns YES or the timeout is reached, the method will exit.
 If a non-zero exit code is returned, the method will exit.

 @param command the Command String to run.
 @param error Error Outparam for any error that occures
 @param block the predicate to verify stdOut against
 @return YES if the untilTrue block returns YES before the timeout, NO otherwise.
 */
- (BOOL)repeatedlyRunCommand:(NSString *)command withError:(NSError **)error untilTrue:( BOOL(^)(NSString *stdOut) )block;

@end
