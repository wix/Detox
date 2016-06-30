/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 Uses the known values of SimDeviceType ProductFamilyID, to construct an enumeration.
 These mirror the values from -[SimDeviceState productFamilyID].
 */
typedef NS_ENUM(NSUInteger, FBControlCoreProductFamily) {
  FBControlCoreProductFamilyUnknown = 0,
  FBControlCoreProductFamilyiPhone = 1,
  FBControlCoreProductFamilyiPad = 2,
  FBControlCoreProductFamilyAppleTV = 3,
  FBControlCoreProductFamilyAppleWatch = 4,
};

NS_ASSUME_NONNULL_BEGIN

@interface FBControlCoreConfigurationVariant_Base : NSObject <NSCoding, NSCopying>
@end

#pragma mark Families

@protocol FBSimulatorConfiguration_Family <NSObject>

@property (nonatomic, assign, readonly) FBControlCoreProductFamily productFamilyID;

@end

@interface FBSimulatorConfiguration_Family_iPhone : FBControlCoreConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

@interface FBSimulatorConfiguration_Family_iPad : FBControlCoreConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

@interface FBSimulatorConfiguration_Family_Watch : FBControlCoreConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

@interface FBSimulatorConfiguration_Family_TV : FBControlCoreConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

#pragma mark Devices

@protocol FBControlCoreConfiguration_Device <NSObject>

@property (nonatomic, copy, readonly) NSString *deviceName;
@property (nonatomic, copy, readonly) NSSet<NSString *> *productTypes;
@property (nonatomic, copy, readonly) NSString *deviceArchitecture;
@property (nonatomic, copy, readonly) NSString *simulatorArchitecture;
@property (nonatomic, strong, readonly) id<FBSimulatorConfiguration_Family> family;

@end

@interface FBControlCoreConfiguration_Device_iPhone_Base : FBControlCoreConfigurationVariant_Base <FBControlCoreConfiguration_Device>
@end

@interface FBControlCoreConfiguration_Device_iPhone4s : FBControlCoreConfiguration_Device_iPhone_Base
@end

@interface FBControlCoreConfiguration_Device_iPhone5 : FBControlCoreConfiguration_Device_iPhone_Base
@end

@interface FBControlCoreConfiguration_Device_iPhone5s : FBControlCoreConfiguration_Device_iPhone_Base
@end

@interface FBControlCoreConfiguration_Device_iPhone6 : FBControlCoreConfiguration_Device_iPhone_Base
@end

@interface FBControlCoreConfiguration_Device_iPhone6Plus : FBControlCoreConfiguration_Device_iPhone_Base
@end

@interface FBControlCoreConfiguration_Device_iPhone6S : FBControlCoreConfiguration_Device_iPhone_Base
@end

@interface FBControlCoreConfiguration_Device_iPhone6SPlus : FBControlCoreConfiguration_Device_iPhone_Base
@end

@interface FBControlCoreConfiguration_Device_iPad_Base : FBControlCoreConfigurationVariant_Base <FBControlCoreConfiguration_Device>
@end

@interface FBControlCoreConfiguration_Device_iPad2 : FBControlCoreConfiguration_Device_iPad_Base
@end

@interface FBControlCoreConfiguration_Device_iPadRetina : FBControlCoreConfiguration_Device_iPad_Base
@end

@interface FBControlCoreConfiguration_Device_iPadAir : FBControlCoreConfiguration_Device_iPad_Base
@end

@interface FBControlCoreConfiguration_Device_iPadAir2 : FBControlCoreConfiguration_Device_iPad_Base
@end

@interface FBControlCoreConfiguration_Device_iPadPro : FBControlCoreConfiguration_Device_iPad_Base
@end

@interface FBControlCoreConfiguration_Device_tvOS_Base : FBControlCoreConfigurationVariant_Base <FBControlCoreConfiguration_Device>
@end

@interface FBControlCoreConfiguration_Device_AppleTV1080p : FBControlCoreConfiguration_Device_tvOS_Base
@end

@interface FBControlCoreConfiguration_Device_watchOS_Base : FBControlCoreConfigurationVariant_Base <FBControlCoreConfiguration_Device>
@end

@interface FBControlCoreConfiguration_Device_AppleWatch38mm : FBControlCoreConfiguration_Device_watchOS_Base
@end

@interface FBControlCoreConfiguration_Device_AppleWatch42mm : FBControlCoreConfiguration_Device_watchOS_Base
@end

#pragma mark OS Versions

@protocol FBControlCoreConfiguration_OS <NSObject>

@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, copy, readonly) NSDecimalNumber *versionNumber;
@property (nonatomic, copy, readonly) NSSet *families;

@end

@interface FBControlCoreConfiguration_OS_Base : FBControlCoreConfigurationVariant_Base <FBControlCoreConfiguration_OS>
@end

@interface FBControlCoreConfiguration_iOS_Base : FBControlCoreConfiguration_OS_Base
@end

@interface FBControlCoreConfiguration_iOS_7_1 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_8_0 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_8_1 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_8_2 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_8_3 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_8_4 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_9_0 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_9_1 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_9_2 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_9_3 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_9_3_1 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_9_3_2 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_iOS_10_0 : FBControlCoreConfiguration_iOS_Base
@end

@interface FBControlCoreConfiguration_tvOS_Base : FBControlCoreConfiguration_OS_Base
@end

@interface FBControlCoreConfiguration_tvOS_9_0 : FBControlCoreConfiguration_tvOS_Base
@end

@interface FBControlCoreConfiguration_tvOS_9_1 : FBControlCoreConfiguration_tvOS_Base
@end

@interface FBControlCoreConfiguration_tvOS_9_2 : FBControlCoreConfiguration_tvOS_Base
@end

@interface FBControlCoreConfiguration_watchOS_Base : FBControlCoreConfiguration_OS_Base
@end

@interface FBControlCoreConfiguration_watchOS_2_0 : FBControlCoreConfiguration_watchOS_Base
@end

@interface FBControlCoreConfiguration_watchOS_2_1 : FBControlCoreConfiguration_watchOS_Base
@end

@interface FBControlCoreConfiguration_watchOS_2_2 : FBControlCoreConfiguration_watchOS_Base
@end

/**
 Mappings of Variants.
 */
@interface FBControlCoreConfigurationVariants : NSObject

/**
 Maps Device Names to Devices.
 */
+ (NSDictionary<NSString *, id<FBControlCoreConfiguration_Device>> *)nameToDevice;

/**
 Maps Device 'ProductType' to Device Variants.
 */
+ (NSDictionary<NSString *, id<FBControlCoreConfiguration_Device>> *)productTypeToDevice;

/**
 OS Version names to OS Versions.
 */
+ (NSDictionary<NSString *, id<FBControlCoreConfiguration_OS>> *)nameToOSVersion;

/**
 Maps the architechture of the target to the compatible architechtures for binaries on the target.
 */
+ (NSDictionary<NSString *, NSSet<NSString *> *> *)baseArchToCompatibleArch;

@end

NS_ASSUME_NONNULL_END
