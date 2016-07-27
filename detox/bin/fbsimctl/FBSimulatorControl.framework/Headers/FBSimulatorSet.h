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

@class FBProcessFetcher;
@class FBSimulator;
@class FBSimulatorConfiguration;
@class FBSimulatorControl;
@class FBSimulatorControlConfiguration;
@class FBiOSTargetQuery;
@class SimDeviceSet;
@protocol FBControlCoreLogger;

NS_ASSUME_NONNULL_BEGIN

/**
 Complements SimDeviceSet with additional functionality and more resiliant behaviours.
 Performs the preconditions necessary to call certain SimDeviceSet/SimDevice methods.
 */
@interface FBSimulatorSet : NSObject <FBDebugDescribeable, FBJSONSerializable>

#pragma mark Intializers

/**
 Creates and returns an FBSimulatorSet, performing the preconditions defined in the configuration.

 @param configuration the configuration to use. Must not be nil.
 @param logger the logger to use to verbosely describe what is going on. May be nil.
 @param error any error that occurred during the creation of the pool.
 @returns a new FBSimulatorPool.
 */
+ (instancetype)setWithConfiguration:(FBSimulatorControlConfiguration *)configuration control:(FBSimulatorControl *)control logger:(nullable id<FBControlCoreLogger>)logger error:(NSError **)error;

#pragma mark Querying

/**
 Fetches the Simulators from the Set, matching the query.

 @param query the Query to query with.
 @return an array of matching Simulators.
 */
- (NSArray<FBSimulator *> *)query:(FBiOSTargetQuery *)query;

#pragma mark Creation Methods

/**
 Creates and returns a FBSimulator fbased on a configuration.

 @param configuration the Configuration of the Device to Allocate. Must not be nil.
 @param error an error out for any error that occured.
 @return a FBSimulator if one could be allocated with the provided options, nil otherwise
 */
- (nullable FBSimulator *)createSimulatorWithConfiguration:(FBSimulatorConfiguration *)configuration error:(NSError **)error;

#pragma mark Creation Methods

/**
 Kills a Simulator in the Set.
 The Set to which the Simulator belongs must be the reciever.

 @param simulator the Simulator to delete. Must not be nil.
 @param error an error out for any error that occurs.
 @return YES if successful, nil otherwise.
 */
- (BOOL)killSimulator:(FBSimulator *)simulator error:(NSError **)error;

/**
 Erases a Simulator in the Set.
 The Set to which the Simulator belongs must be the reciever.

 @param simulator the Simulator to erase. Must not be nil.
 @param error an error out for any error that occurs.
 @return YES if successful, nil otherwise.
 */
- (BOOL)eraseSimulator:(FBSimulator *)simulator error:(NSError **)error;

/**
 Deletes a Simulator in the Set.
 The Set to which the Simulator belongs must be the reciever.

 @param simulator the Simulator to delete. Must not be nil.
 @param error an error out for any error that occurs.
 @return YES if successful, nil otherwise.
 */
- (BOOL)deleteSimulator:(FBSimulator *)simulator error:(NSError **)error;

/**
 Kills all provided Simulators.
 The Set to which the Simulators belong must be the reciever.

 @param simulators the Simulators to kill. Must not be nil.
 @param error an error out for any error that occurs.
 @return an array of the Simulators passed to the reciever if successful, nil otherwise.
 */
- (nullable NSArray<FBSimulator *> *)killAll:(NSArray<FBSimulator *> *)simulators error:(NSError **)error;

/**
 Erases all provided Simulators.
 The Set to which the Simulators belong must be the reciever.

 @param simulators the Simulators to erase. Must not be nil.
 @param error an error out for any error that occurs.
 @return an array of the Simulators passed to the reciever if successful, nil otherwise.
 */
- (nullable NSArray<FBSimulator *> *)eraseAll:(NSArray<FBSimulator *> *)simulators error:(NSError **)error;

/**
 Erases all provided Simulators.
 The Set to which the Simulators belong must be the reciever.

 @param simulators the Simulators to delete. Must not be nil.
 @param error an error out for any error that occurs.
 @return an array of the UDIDs of the Simulators passed to the reciever if successful, nil otherwise.
 */
- (nullable NSArray<NSString *> *)deleteAll:(NSArray<FBSimulator *> *)simulators error:(NSError **)error;

/**
 Kills all of the Simulators that belong to the reciever.

 @param error an error out if any error occured.
 @return an array of the Simulators that this were killed if successful, nil otherwise.
 */
- (nullable NSArray<FBSimulator *> *)killAllWithError:(NSError **)error;

/**
 Kills all of the Simulators that belong to the reciever.

 @param error an error out if any error occured.
 @return an array of the Simulators that this were killed if successful, nil otherwise.
 */
- (nullable NSArray<FBSimulator *> *)eraseAllWithError:(NSError **)error;

/**
 Delete all of the Simulators that belong to the reciever.

 @param error an error out if any error occured.
 @return an Array of the names of the Simulators that were deleted if successful, nil otherwise.
 */
- (nullable NSArray<NSString *> *)deleteAllWithError:(NSError **)error;

/**
 The Logger to use.
 */
@property (nonatomic, strong, readonly) id<FBControlCoreLogger> logger;

/**
 Returns the configuration for the reciever.
 */
@property (nonatomic, copy, readonly) FBSimulatorControlConfiguration *configuration;

/**
 The FBSimulatorControl Instance to which the Set Belongs.
 */
@property (nonatomic, weak, readonly) FBSimulatorControl *control;

/**
 The SimDeviceSet to that is owned by the reciever.
 */
@property (nonatomic, strong, readonly) SimDeviceSet *deviceSet;

/**
 The FBProcessFetcher that is used to obtain Simulator Process Information.
 */
@property (nonatomic, strong, readonly) FBProcessFetcher *processFetcher;

/**
 An NSArray<FBSimulator> of all Simulators in the Set.
*/
@property (nonatomic, copy, readonly) NSArray<FBSimulator *> *allSimulators;

@end

NS_ASSUME_NONNULL_END
