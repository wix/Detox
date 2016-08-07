/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBSimulatorInteraction.h>

/**
 Interactions dependent on the existence of an FBSimulatorConnection on a booted Simulator.
 */
@interface FBSimulatorInteraction (Bridge)

/**
 Starts Recording video on the Simulator.
 The Interaction will always succeed if the Simulator has a FBFramebufferVideo instance.
 The Interaction will always fail if the Simulator does not have a FBFramebufferVideo instance.

 @return the reciever, for chaining.
 */
- (instancetype)startRecordingVideo;

/**
 Stops Recording video on the Simulator.
 The Interaction will always succeed if the Simulator has a FBFramebufferVideo instance.
 The Interaction will always fail if the Simulator does not have a FBFramebufferVideo instance.

 @return the reciever, for chaining.
 */
- (instancetype)stopRecordingVideo;

/**
 Performs a Press on the Simulator's Screen with the given co-ordinates.

 @param x the X Coordinate.
 @param y the Y Coordinate.
 @return the reciever, for chaining.
 */
- (instancetype)tap:(double)x y:(double)y;

@end
