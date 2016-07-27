/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>

#import <FBControlCore/FBControlCore.h>

@class FBDiagnostic;

/**
 Options for FBFramebufferVideo.
 */
typedef NS_OPTIONS(NSUInteger, FBFramebufferVideoOptions) {
  FBFramebufferVideoOptionsAutorecord = 1 << 0, /** If Set, will automatically start recording when the first video frame is recieved. **/
  FBFramebufferVideoOptionsImmediateFrameStart = 1 << 1, /** If Set, will start recording a video immediately, using the previously delivered frame **/
  FBFramebufferVideoOptionsFinalFrame = 1 << 2, /** If Set, will repeat the last frame just before a video is stopped **/
};

/**
 A Configuration Value for FBFramebufferVideo.

 */
@interface FBFramebufferVideoConfiguration : NSObject <NSCoding, NSCopying, FBJSONSerializable, FBDebugDescribeable>

/**
 The Diagnostic Value to determine the video path.
 */
@property (nonatomic, copy, readonly) FBDiagnostic *diagnostic;

/**
 YES if the Video Component should automatically record when the first frame comes in.
 */
@property (nonatomic, assign, readonly) FBFramebufferVideoOptions options;

/**
 The Timescale used in Video Encoding.
 */
@property (nonatomic, assign, readonly) CMTimeScale timescale;

/**
 The Rounding Method used for Video Frames.
 */
@property (nonatomic, assign, readonly) CMTimeRoundingMethod roundingMethod;

/**
 The FileType of the Video.
 */
@property (nonatomic, copy, readonly) NSString *fileType;

#pragma mark Defaults & Initializers

/**
 The Default Value of FBFramebufferVideoConfiguration.
 Uses Reasonable Defaults.
 */
+ (instancetype)defaultConfiguration;

/**
 The Default Value of FBFramebufferVideoConfiguration.
 Use this in preference to 'defaultConfiguration' if video encoding is problematic.
 */
+ (instancetype)prudentConfiguration;

/**
 Creates and Returns a new FBFramebufferVideoConfiguration Value with the provided parameters.

 @param diagnostic The Diagnostic Value to determine the video path
 @param options The Flags for FBFramebufferVideo.
 @param timescale The Timescale used in Video Encoding.
 @param roundingMethod The Rounding Method used for Video Frames.
 @param fileType The FileType of the Video.
 @return a FBFramebufferVideoConfiguration instance.
 */
+ (instancetype)withDiagnostic:(FBDiagnostic *)diagnostic options:(FBFramebufferVideoOptions)options timescale:(CMTimeScale)timescale roundingMethod:(CMTimeRoundingMethod)roundingMethod fileType:(NSString *)fileType;

#pragma mark Diagnostics

/**
 Returns a new Configuration with the Diagnostic Applied.
 */
+ (instancetype)withDiagnostic:(FBDiagnostic *)diagnostic;
- (instancetype)withDiagnostic:(FBDiagnostic *)diagnostic;

#pragma mark Options

/**
 Returns a new Configuration with the Options Applied.
 */
- (instancetype)withOptions:(FBFramebufferVideoOptions)options;
+ (instancetype)withOptions:(FBFramebufferVideoOptions)options;

#pragma mark Timescale

/**
 Returns a new Configuration with the Timescale Applied.
 */
- (instancetype)withTimescale:(CMTimeScale)timescale;
+ (instancetype)withTimescale:(CMTimeScale)timescale;

#pragma mark Rounding

/**
 Returns a new Configuration with the Rounding Method Applied.
 */
- (instancetype)withRoundingMethod:(CMTimeRoundingMethod)roundingMethod;
+ (instancetype)withRoundingMethod:(CMTimeRoundingMethod)roundingMethod;

#pragma mark File Type

/**
 Returns a new Configuration with the File Type Applied.
 */
- (instancetype)withFileType:(NSString *)fileType;
+ (instancetype)withFileType:(NSString *)fileType;

@end
