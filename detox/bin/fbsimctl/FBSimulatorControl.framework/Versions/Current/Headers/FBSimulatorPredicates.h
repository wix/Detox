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

#import <FBSimulatorControl/FBSimulator.h>

@class FBSimulatorConfiguration;
@class FBSimulatorPool;

NS_ASSUME_NONNULL_BEGIN

/**
 Predicates for filtering collections of available Simulators.
 NSCompoundPredicate can be used to compose Predicates.
 All Prediates operate on collections of FBSimulator instances.
 */
@interface FBSimulatorPredicates : FBiOSTargetPredicates

/**
 Predicate for Simulators that are allocated in a specific Pool.

 @param pool the Pool to match against. Must not be nil.
 @return an NSPredicate.
 */
+ (NSPredicate *)allocatedByPool:(FBSimulatorPool *)pool;

/**
 Predicate for Simulators that are managed by a pool but not allocated.

 @param pool the Pool to match against. Must not be nil.
 @return an NSPredicate.
 */
+ (NSPredicate *)unallocatedByPool:(FBSimulatorPool *)pool;

/**
 Predicate for Simulators that are launched.

 @return an NSPredicate.
 */
+ (NSPredicate *)launched;

/**
 Predicate for matching Simulators against a Configuration.

 @param configuration the configuration to match against.
 @return an NSPredicate.
 */
+ (NSPredicate *)configuration:(FBSimulatorConfiguration *)configuration;

/**
 Predicate for matching any of the provided configurations against a Simulator.

 @param configurations the configuration to match against.
 @return an NSPredicate.
 */
+ (NSPredicate *)configurations:(NSArray<FBSimulatorConfiguration *> *)configurations;

@end

NS_ASSUME_NONNULL_END
