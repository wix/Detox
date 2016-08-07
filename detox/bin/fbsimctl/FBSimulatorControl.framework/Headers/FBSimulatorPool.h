/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBDebugDescribeable.h>

@class FBSimulator;
@class FBSimulatorConfiguration;
@class FBSimulatorControlConfiguration;
@class FBSimulatorPool;
@class FBSimulatorSet;

NS_ASSUME_NONNULL_BEGIN

/**
 Options for how a pool should handle allocation & freeing.
 */
typedef NS_OPTIONS(NSUInteger, FBSimulatorAllocationOptions){
  FBSimulatorAllocationOptionsCreate = 1 << 0, /** Permit the creation of Simulators when allocating. */
  FBSimulatorAllocationOptionsReuse = 1 << 1, /** Permit the reuse of Simulators when allocating. */
  FBSimulatorAllocationOptionsShutdownOnAllocate = 1 << 2, /** Shutdown of the Simulator becomes a precondition of allocation. */
  FBSimulatorAllocationOptionsEraseOnAllocate = 1 << 4, /** Erasing of the Simulator becomes a precondition of allocation. */
  FBSimulatorAllocationOptionsDeleteOnFree = 1 << 5, /** Deleting of the Simulator becomes a postcondition of freeing. */
  FBSimulatorAllocationOptionsEraseOnFree = 1 << 6, /** Erasing of the Simulator becomes a postcondition of freeing. */
  FBSimulatorAllocationOptionsPersistHistory = 1 << 7 /** Fetch & Persist History for the allocated Simulator. */
};

@protocol FBControlCoreLogger;

/**
 A FBSimulatorPool manages the allocation of Simulators from an FBSimulatorSet.
 This is an optional part of the API that allows clients to use multiple Simulators in the same set whilst avoiding
 using the same Simulator for multiple tasks.
 */
@interface FBSimulatorPool : NSObject <FBDebugDescribeable>

#pragma mark Initializers

/**
 Creates and returns an FBSimulatorPool.

 @param set the FBSimulatorSet to Manage.
 @param logger the logger to use to verbosely describe what is going on. May be nil.
 @returns a new FBSimulatorPool.
 */
+ (instancetype)poolWithSet:(FBSimulatorSet *)set logger:(id<FBControlCoreLogger>)logger;

#pragma mark Methods

/**
 Returns a Device for the given parameters. Will create devices where necessary.
 If you plan on running multiple tests in the lifecycle of a process, you sshould use `freeDevice:error:`
 otherwise devices will continue to be allocated.

 @param configuration the Configuration of the Device to Allocate. Must not be nil.
 @param options the options for the allocation/freeing of the Simulator.
 @param error an error out for any error that occured.
 @return a FBSimulator if one could be allocated with the provided options, nil otherwise
 */
- (nullable FBSimulator *)allocateSimulatorWithConfiguration:(FBSimulatorConfiguration *)configuration options:(FBSimulatorAllocationOptions)options error:(NSError **)error;

/**
 Marks a device that was previously returned from `allocateDeviceWithName:sdkVersion:error:` as free.
 Call this when multiple test runs, or simulators are to be re-used in a process.

 @param simulator the Simulator to Free.
 @param error an error out for any error that occured.
 @return YES if the freeing of the device was successful, NO otherwise.
 */
- (BOOL)freeSimulator:(FBSimulator *)simulator error:(NSError **)error;

/**
 Marks a device that was previously returned from `allocateDeviceWithName:sdkVersion:error:` as free.
 Call this when multiple test runs, or simulators are to be re-used in a process.

 @param simulator the Simulator to test.
 @return YES if the Simulator is Allocated, NO otherwise.
 */
- (BOOL)simulatorIsAllocated:(FBSimulator *)simulator;

#pragma mark Properties

/**
 Returns the FBSimulatorSer of the receiver.
 */
@property (nonatomic, strong, readonly) FBSimulatorSet *set;

/**
 An Array of all the Simulators that this Pool has allocated.
 */
@property (nonatomic, copy, readonly) NSArray *allocatedSimulators;

/**
 An Array of all the Simulators that this Pool have not allocated.
 */
@property (nonatomic, copy, readonly) NSArray *unallocatedSimulators;

@end

NS_ASSUME_NONNULL_END
