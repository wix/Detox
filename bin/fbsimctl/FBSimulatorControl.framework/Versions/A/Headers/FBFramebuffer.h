/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBControlCore.h>

@class FBFramebufferVideo;
@class FBSimulator;
@class FBSimulatorLaunchConfiguration;
@class SimDeviceFramebufferService;
@protocol FBFramebufferDelegate;

/**
 A container and client for a Simulator's Framebuffer that forwards important events to delegates.

 The class itself doesn't perform much behaviour other than to manage the lifecycle.
 Implementors of FBFramebufferDelegate perform individual behaviours such as recording videos and images.
 */
@interface FBFramebuffer : NSObject <FBJSONSerializable>

/**
 Creates and returns a new FBSimulatorDirectLaunch object for the provided SimDeviceFramebufferService.

 @param framebufferService the SimDeviceFramebufferService to connect to.
 @param launchConfiguration the launch configuration to create the service for.
 @param simulator the Simulator to which the Framebuffer belongs.
 @return a new FBSimulatorDirectLaunch instance. Must not be nil.
 */
+ (instancetype)withFramebufferService:(SimDeviceFramebufferService *)framebufferService configuration:(FBSimulatorLaunchConfiguration *)launchConfiguration simulator:(FBSimulator *)simulator;

/**
 Starts listening for Framebuffer events from the SimDeviceFramebufferService on an internal background queue.
 Events are delivered to the Framebuffer's Delegate on this queue.
 Delegates can do work on the queue on which they recieve events, but any heavy work should be dispatched to other queues.
 Must only be called from the main queue.

 @return the reciever, for chaining.
 */
- (instancetype)startListeningInBackground;

/**
 Stops listening for Framebuffer Events from SimDeviceFramebufferService.
 Must only be called from the main queue.
 A dispatch_group is provided to allow for delegates to append any asychronous operations that may need cleanup.
 For example in the case of the Video Recorder, this means completing the writing to file.

 @param teardownGroup the dispatch_group to append asynchronous operations to.
 @return the reciever, for chaining.
 */
- (instancetype)stopListeningWithTeardownGroup:(dispatch_group_t)teardownGroup;

/**
 The FBFramebufferVideo instance owned by the receiver.
 */
@property (nonatomic, strong, readonly) FBFramebufferVideo *video;

@end
