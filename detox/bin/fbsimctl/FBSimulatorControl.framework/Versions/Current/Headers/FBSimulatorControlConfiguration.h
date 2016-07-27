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

@class FBSimulatorApplication;

/**
 Options that apply to each FBSimulatorControl instance.
 */
typedef NS_OPTIONS(NSUInteger, FBSimulatorManagementOptions){
  FBSimulatorManagementOptionsDeleteAllOnFirstStart = 1 << 0, /** Deletes all of the devices in the pool, upon creation of the Pool */
  FBSimulatorManagementOptionsKillAllOnFirstStart = 1 << 1, /** Kills all of the devices in the pool, upon creation of the Pool */
  FBSimulatorManagementOptionsKillSpuriousSimulatorsOnFirstStart = 1 << 2, /** Kills all Simulators not managed by FBSimulatorControl when creating a Pool */
  FBSimulatorManagementOptionsIgnoreSpuriousKillFail = 1 << 3, /** Don't fail Pool creation when failing to kill spurious Simulators */
  FBSimulatorManagementOptionsKillSpuriousCoreSimulatorServices = 1 << 4, /** Kills CoreSimulatorService daemons from the non-current Xcode version when creating a Pool */
  FBSimulatorManagementOptionsUseSimDeviceTimeoutResiliance = 1 << 5, /** Uses an alternative strategy for communicating with the Simulator that may be more robust with Xcode 7.1 */
};

/**
 A Value object with the information required to create a Simulator Pool.
 */
@interface FBSimulatorControlConfiguration : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBDebugDescribeable>

/**
 Creates and returns a new Configuration with the provided parameters.

 @param options the options for Simulator Management.
 @param deviceSetPath the Path to the Device Set. If nil, the default Device Set will be used.
 @returns a new Configuration Object with the arguments applied.
 */
+ (instancetype _Nonnull)configurationWithDeviceSetPath:(NSString *_Nullable)deviceSetPath options:(FBSimulatorManagementOptions)options;

/**
 The Location of the SimDeviceSet. If no path is provided, the default device set will be used.
 */
@property (nonatomic, copy, readonly) NSString *_Nullable deviceSetPath;

/**
 The Options for Simulator Management.
 */
@property (nonatomic, assign, readonly) FBSimulatorManagementOptions options;

@end

/**
 Global CoreSimulatorConfiguration
 */
@interface FBSimulatorControlConfiguration (Helpers)

/**
 The Location of the Default SimDeviceSet
 */
+ (NSString *_Nonnull)defaultDeviceSetPath;

@end
