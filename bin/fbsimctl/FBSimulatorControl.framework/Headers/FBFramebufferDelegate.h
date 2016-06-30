/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>

@class FBFramebuffer;
@class FBFramebufferFrame;

/**
 A Delegate for updates from a Simulator's Framebuffer.
 */
@protocol FBFramebufferDelegate <NSObject>

/**
 Called when an Image Frame is available.

 @param frame the updated frame.
 */
- (void)framebuffer:(FBFramebuffer *)framebuffer didUpdate:(FBFramebufferFrame *)frame;

/**
 Called when the framebuffer is no longer valid, typically when the Simulator shuts down.

 @param framebuffer the framebuffer that was updated.
 @param error an error, if any occured in the teardown of the simulator.
 @param teardownGroup a dispatch_group to add asynchronous tasks to that should be performed in the teardown of the Framebuffer.
 */
- (void)framebuffer:(FBFramebuffer *)framebuffer didBecomeInvalidWithError:(NSError *)error teardownGroup:(dispatch_group_t)teardownGroup;

@end
