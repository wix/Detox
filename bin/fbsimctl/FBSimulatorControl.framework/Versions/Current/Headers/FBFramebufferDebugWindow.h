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
 A Framebuffer Delegate that renders to a window.

 This will create an NSApplication in the current process so buyer beware.
 It is intended to be used for debugging purposes only.
 */
@interface FBFramebufferDebugWindow : NSObject <FBFramebufferDelegate>

/**
 Creates and returns an object that will display the framebuffer in a window.

 @param name the name of the Window.
 @return a new FBFramebufferDebugWindow instance.
 */
+ (instancetype)withName:(NSString *)name;

@end
