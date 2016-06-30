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

@class FBFramebufferVideoConfiguration;

/**
 An Option Set for Direct Launching.
 */
typedef NS_OPTIONS(NSUInteger, FBSimulatorLaunchOptions) {
  FBSimulatorLaunchOptionsConnectBridge = 1 << 0, /** Connects the Simulator Bridge on launch, rather than lazily on-demand */
  FBSimulatorLaunchOptionsEnableDirectLaunch = 1 << 1, /** Launches the Simulator via directly (via SimDevice) instead of with Simulator.app. Enables Framebuffer Connection. */
  FBSimulatorLaunchOptionsShowDebugWindow = 1 << 2, /** Relays the Simulator Framebuffer to a window */
  FBSimulatorLaunchOptionsUseNSWorkspace = 1 << 3, /** Uses -[NSWorkspace launchApplicationAtURL:options:configuration::error:] to launch Simulator.app */
};

NS_ASSUME_NONNULL_BEGIN

/**
 A Value Object for defining how to launch a Simulator.
 */
@interface FBSimulatorLaunchConfiguration : NSObject <NSCoding, NSCopying, FBJSONSerializable, FBDebugDescribeable>

/**
 Options for how the Simulator should be launched.
 */
@property (nonatomic, assign, readonly) FBSimulatorLaunchOptions options;

/**
 The Locale in which to Simulate, may be nil.
 */
@property (nonatomic, nullable, strong, readonly) FBLocalizationOverride *localizationOverride;

/**
 A String representing the Scaling Factor at which to launch the Simulator.
 */
@property (nonatomic, copy, readonly) NSString *scaleString;

/**
 Configuration for Framebuffer Video encoding.
 Only applies if FBSimulatorLaunchOptionsEnableDirectLaunch is flagged.
 */
@property (nonatomic, copy, readonly) FBFramebufferVideoConfiguration *video;

#pragma mark Default Instance

+ (instancetype)defaultConfiguration;

#pragma mark Launch Options

/**
 Set Direct Launch Options
 */
+ (instancetype)withOptions:(FBSimulatorLaunchOptions)options;
- (instancetype)withOptions:(FBSimulatorLaunchOptions)options;

#pragma mark Device Scale

/**
 Launch at 25% Scale.
 */
+ (instancetype)scale25Percent;
- (instancetype)scale25Percent;

/**
 Launch at 50% Scale.
 */
+ (instancetype)scale50Percent;
- (instancetype)scale50Percent;

/**
 Launch at 75% Scale.
 */
+ (instancetype)scale75Percent;
- (instancetype)scale75Percent;

/**
 Launch at 100% Scale.
 */
+ (instancetype)scale100Percent;
- (instancetype)scale100Percent;

/**
 Scales the provided size with the receiver's scale/

 @param size the size to scale.
 @return a scaled size.
 */
- (CGSize)scaleSize:(CGSize)size;

#pragma mark Locale

/**
 Set the Localization Override
 */
+ (instancetype)withLocalizationOverride:(nullable FBLocalizationOverride *)localizationOverride;
- (instancetype)withLocalizationOverride:(nullable FBLocalizationOverride *)localizationOverride;

#pragma mark Video

/**
 Set Video Configuration
 */
+ (instancetype)withVideo:(FBFramebufferVideoConfiguration *)video;
- (instancetype)withVideo:(FBFramebufferVideoConfiguration *)video;

@end

NS_ASSUME_NONNULL_END
