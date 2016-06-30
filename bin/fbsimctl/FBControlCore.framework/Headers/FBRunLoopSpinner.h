/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@interface FBRunLoopSpinner : NSObject

/**
 Dispatches block to background thread and Spins the Run Loop until `block` finishes.
 @param block the block to wait for to finish.
 @return object returned by `block`
 */
+ (id)spinUntilBlockFinished:(id (^)())block;

/**
 Updates the message that is logged at an interval.

 @param reminderMessage the time interval between reminder messages.
 @return the reciever, for chaining.
 */
- (instancetype)reminderMessage:(NSString *)reminderMessage;

/**
 Updates the frequency with which the reciver logs the reminder message.

 @param reminderInterval the time interval between reminder messages.
 @return the reciever, for chaining.
 */
- (instancetype)reminderInterval:(NSTimeInterval)reminderInterval;

/**
 Updates the error message to print in the event of a timeout.

 @param timeoutErrorMessage the Error Message to print.
 @return the reciever, for chaining.
 */
- (instancetype)timeoutErrorMessage:(NSString *)timeoutErrorMessage;

/**
 Updates the timeout of the reciever.

 @param timeout the amount of time to wait before timing out.
 @return the reciever, for chaining.
 */
- (instancetype)timeout:(NSTimeInterval)timeout;

/**
 Spins the Run Loop until `untilTrue` returns YES or a timeout is reached.
 @param untilTrue the condition to meet.
 @return YES if the condition was met, NO if the timeout was reached first.
 */
- (BOOL)spinUntilTrue:( BOOL (^)(void) )untilTrue;

/**
 Spins the Run Loop until `untilTrue` returns YES or a timeout is reached.
 @param untilTrue the condition to meet.
 @param error to fill in case of timeout.
 @return YES if the condition was met, NO if the timeout was reached first.
 */
- (BOOL)spinUntilTrue:( BOOL (^)(void) )untilTrue error:(NSError **)error;

@end

/**
 Conveniences to aid synchronous waiting on events, whilst not blocking other event sources.
 */
@interface NSRunLoop (FBControlCore)

/**
 Spins the Run Loop until `untilTrue` returns YES or a timeout is reached.

 @oaram timeout the Timeout in Seconds.
 @param untilTrue the condition to meet.
 @returns YES if the condition was met, NO if the timeout was reached first.
 */
- (BOOL)spinRunLoopWithTimeout:(NSTimeInterval)timeout untilTrue:( BOOL (^)(void) )untilTrue;

/**
 Spins the Run Loop until `untilTrue` returns a value, or a timeout is reached.

 @oaram timeout the Timeout in Seconds.
 @param untilExists the mapping to a value.
 @returns the return value of untilTrue, or nil if a timeout was reached.
 */
- (id)spinRunLoopWithTimeout:(NSTimeInterval)timeout untilExists:( id (^)(void) )untilExists;

/**
 Spins the Run Loop until the group completes, or a timeout is reached.

 @param timeout the Timeout in Seconds.
 @param group the group to wait on.
 @return YES if the group completed before the timeout, NO otherwise.
 */
- (BOOL)spinRunLoopWithTimeout:(NSTimeInterval)timeout notifiedBy:(dispatch_group_t)group onQueue:(dispatch_queue_t)queue;

@end
