/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBTerminationHandle.h>

/**
 A class for wrapping `dispatch_source` with some conveniences.
 */
@interface FBDispatchSourceNotifier : NSObject<FBTerminationHandle>

/**
 Creates and returns an `FBDispatchSourceNotifier` that will call the `handler` when the provided `processIdentifier` quits

 @param processIdentifier the Process Identifier of the Process to Monitor
 @param handler the handler to call when the process exits
 */
+ (instancetype)processTerminationNotifierForProcessIdentifier:(pid_t)processIdentifier handler:(void (^)(FBDispatchSourceNotifier *))handler;

@end
