/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

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

@end
