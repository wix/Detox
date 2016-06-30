/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBSimulator;

/**
 A Polyfill to -[SimDevice addVideo:error:] on versions of CoreSimulator prior to the existence of this API.
 */
@interface FBAddVideoPolyfill : NSObject

/**
 Makes a Polyfill for the given Simulator.

 @param simulator the Simulator to polyfill.
 @return a new FBAddVideoPolyfill instance.
 */
+ (instancetype)withSimulator:(FBSimulator *)simulator;

/**
 Adds a Video to the Camera Roll by injecting Shimulator into 'MobileSlideshow' and using this hook to upload videos.

 @param paths the paths of the videos to upload.
 @param error an error out.
 @return YES if successful, NO otherwise.
 */
- (BOOL)addVideos:(NSArray *)paths error:(NSError **)error;

@end
