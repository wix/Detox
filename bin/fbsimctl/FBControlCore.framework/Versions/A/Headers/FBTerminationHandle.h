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
 Simple protocol that defines termination of something
 */
@protocol FBTerminationHandle<NSObject>

- (void)terminate;

@end

@interface FBTerminationHandle : NSObject

/**
 Creates a termination handle that will call the block when `terminate` is called.
 */
+ (id<FBTerminationHandle>)terminationHandleWithBlock:( void(^)(void) )block;

@end
