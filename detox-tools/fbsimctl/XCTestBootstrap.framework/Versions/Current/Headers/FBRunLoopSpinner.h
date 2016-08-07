/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

typedef BOOL (^FBRunLoopSpinnerBlock)();

@interface FBRunLoopSpinner : NSObject

/**
 Dispatches block to background thread and Spins the Run Loop until `block` finishes.
 @param block the block to wait for to finish.
 @return object returned by `block`
 */
+ (id)spinUntilBlockFinished:(id (^)())block;

- (instancetype)reminderMessage:(NSString *)reminderMessage;
- (instancetype)reminderInterval:(NSTimeInterval)reminderInterval;
- (instancetype)timeoutErrorMessage:(NSString *)timeoutErrorMessage;
- (instancetype)timeout:(NSTimeInterval)timeout;

/**
 Spins the Run Loop until `untilTrue` returns YES or a timeout is reached.
 @param untilTrue the condition to meet.
 @return YES if the condition was met, NO if the timeout was reached first.
 */
- (BOOL)spinUntilTrue:(FBRunLoopSpinnerBlock)untilTrue;

/**
 Spins the Run Loop until `untilTrue` returns YES or a timeout is reached.
 @param untilTrue the condition to meet.
 @param error to fill in case of timeout.
 @return YES if the condition was met, NO if the timeout was reached first.
 */
- (BOOL)spinUntilTrue:(FBRunLoopSpinnerBlock)untilTrue error:(NSError **)error;

@end
