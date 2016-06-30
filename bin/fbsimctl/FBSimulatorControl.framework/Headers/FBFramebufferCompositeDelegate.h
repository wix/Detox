/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBFramebufferDelegate.h>

/**
 A Framebuffer Delegate that forwards all messages to an array of delegates.
 */
@interface FBFramebufferCompositeDelegate : NSObject <FBFramebufferDelegate>

/**
 A Composite Delegate that will notify an array of delegates.

 @param delegates the delegates to call.
 @return a composite framebuffer delegate.
 */
+ (instancetype)withDelegates:(NSArray *)delegates;

@end
