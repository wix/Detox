/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulatorInteraction.h>

@interface FBSimulatorInteraction (Upload)

/**
 Uploads photos or videos to the Camera Roll of the Simulator.

 @param mediaPaths an NSArray<NSString *> of File Paths for the Videos to Upload.
 @return the reciever, for chaining.
 */
- (instancetype)uploadMedia:(NSArray<NSString *> *)mediaPaths;

/**
 Uploads photos to the Camera Roll of the Simulator

 @param photoPaths photoPaths an NSArray<NSString *> of File Paths for the Photos to Upload.
 @return the reciever, for chaining.
 */
- (instancetype)uploadPhotos:(NSArray<NSString *> *)photoPaths;

/**
 Uploads videos to the Camera Roll of the Simulator

 @param videoPaths an NSArray<NSString *> of File Paths for the Videos to Upload.
 @return the reciever, for chaining.
 */
- (instancetype)uploadVideos:(NSArray<NSString *> *)videoPaths;

@end
