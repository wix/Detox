/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBiOSTarget.h>
#import <FBControlCore/FBJSONConversion.h>
#import <FBControlCore/FBControlCoreConfigurationVariants.h>

NS_ASSUME_NONNULL_BEGIN

@class FBSimulatorSet;

/**
 A Value representing a way of fetching Simulators.
 */
@interface FBiOSTargetQuery : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBJSONDeserializable>

/**
 A Query that matches all iOS Targets.

 @return a new Query matching all Targets.
 */
+ (instancetype)allTargets;

/**
 A Query that matches the given UDIDs.

 @param udids the UDIDs to match against.
 @return a new Target Query.
 */
+ (instancetype)udids:(NSArray<NSString *> *)udids;
- (instancetype)udids:(NSArray<NSString *> *)udids;

/**
 A Query that matches the given States.

 @param states the UDIDs to match against.
 @return a new Target Query.
 */
+ (instancetype)states:(NSIndexSet *)states;
- (instancetype)states:(NSIndexSet *)states;

/**
 A Query that matches the given Target Tyep.

 @param targetType the target type to
 @return a new Target Query.
 */
+ (instancetype)targetType:(FBiOSTargetType)targetType;
- (instancetype)targetType:(FBiOSTargetType)targetType;

/**
 A Query that matches the given OS Versions.

 @param osVersions the OS Versions to match against.
 @return a new Target Query.
 */
+ (instancetype)osVersions:(NSArray<id<FBControlCoreConfiguration_OS>> *)osVersions;
- (instancetype)osVersions:(NSArray<id<FBControlCoreConfiguration_OS>> *)osVersions;

/**
 A Query that matches the given Devices.

 @param devices the Devices to match against.
 @return a new Target Query.
 */
+ (instancetype)devices:(NSArray<id<FBControlCoreConfiguration_Device>> *)devices;
- (instancetype)devices:(NSArray<id<FBControlCoreConfiguration_Device>> *)devices;

/**
 A Query that matches the given Range.

 @param range the range to match against.
 @return a new Target Query.
 */
+ (instancetype)range:(NSRange)range;
- (instancetype)range:(NSRange)range;

/**
 Filters iOS Targets based on the reciver.

 @param targets the targets to filter.
 @return a filtered array of targets.
 */
- (NSArray<id<FBiOSTarget>> *)filter:(NSArray<id<FBiOSTarget>> *)targets;

/**
 The UDIDs to Match against.
 An Empty Set means that no UDID filtering will occur.
 */
@property (nonatomic, readonly, copy) NSSet<NSString *> *udids;

/**
 The States to match against, coerced from FBSimulatorState to an NSNumber Representation.
 An Empty Set means that no State filtering will occur.
 */
@property (nonatomic, readonly, copy) NSIndexSet *states;

/**
 The Target Types to match against.
 FBiOSTargetTypeNone means no Target Type filtering with occur.
 */
@property (nonatomic, readonly, assign) FBiOSTargetType targetType;

/**
 The OS Versions to match against.
 An Empty Set means that no OS Version filtering will occur.
 */
@property (nonatomic, readonly, copy) NSSet<id<FBControlCoreConfiguration_OS>> *osVersions;

/**
 The Device Types to match against.
 An Empty Set means that no Device filtering will occur.
 */
@property (nonatomic, readonly, copy) NSSet<id<FBControlCoreConfiguration_Device>> *devices;

/**
 The Range of Simulators to match against when fetched.
 A Location of NSNotFound means that all matching Simulators will be fetched.
 */
@property (nonatomic, readonly, assign) NSRange range;

@end

NS_ASSUME_NONNULL_END
