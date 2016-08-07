/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBSimulatorPool.h>

@class FBApplicationDescriptor ;
@class FBSimulatorConfiguration;
@class FBSimulatorControlConfiguration;
@class FBSimulatorPool;
@class FBSimulatorSet;
@protocol FBControlCoreLogger;

NS_ASSUME_NONNULL_BEGIN

/**
 The Root Class for the FBSimulatorControl Framework.
 */
@interface FBSimulatorControl : NSObject

#pragma mark Initializers

/**
 Creates and returns a new `FBSimulatorControl` instance.

 @param configuration the Configuration to setup the instance with.
 @param logger the logger to use to verbosely describe what is going on. May be nil.
 @param error any error that occurred during instantiation.
 @returns a new FBSimulatorControl instance.
 */
+ (nullable instancetype)withConfiguration:(FBSimulatorControlConfiguration *)configuration logger:(id<FBControlCoreLogger>)logger error:(NSError **)error;

/**
 Creates and returns a new `FBSimulatorControl` instance.

 @param configuration the Configuration to setup the instance with.
 @param error any error that occurred during instantiation.
 @returns a new FBSimulatorControl instance.
 */
+ (nullable instancetype)withConfiguration:(FBSimulatorControlConfiguration *)configuration error:(NSError **)error;


#pragma mark Properties

/**
 The Pool that the FBSimulatorControl instance uses.
 */
@property (nonatomic, strong, readonly) FBSimulatorPool *pool;

/**
 The Pool that the FBSimulatorControl instance uses.
 */
@property (nonatomic, strong, readonly) FBSimulatorSet *set;

/**
 The Configuration that FBSimulatorControl uses.
 */
@property (nonatomic, copy, readwrite) FBSimulatorControlConfiguration *configuration;

@end

NS_ASSUME_NONNULL_END
