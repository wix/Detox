/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBSimulatorControl/FBSimulator.h>
#import <FBSimulatorControl/FBSimulatorConfiguration.h>

@interface FBSimulatorConfigurationVariant_Base : NSObject <NSCoding>
@end

#pragma mark Families

@protocol FBSimulatorConfiguration_Family <NSObject>

- (FBSimulatorProductFamily)productFamilyID;

@end

@interface FBSimulatorConfiguration_Family_iPhone : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

@interface FBSimulatorConfiguration_Family_iPad : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

@interface FBSimulatorConfiguration_Family_Watch : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

@interface FBSimulatorConfiguration_Family_TV : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Family>

@end

#pragma mark Devices

@protocol FBSimulatorConfiguration_Device <NSObject>

- (NSString *)deviceName;
- (id<FBSimulatorConfiguration_Family>)family;

@end

@interface FBSimulatorConfiguration_Device_iPhone_Base : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Device>
@end

@interface FBSimulatorConfiguration_Device_iPhone4s : FBSimulatorConfiguration_Device_iPhone_Base
@end

@interface FBSimulatorConfiguration_Device_iPhone5 : FBSimulatorConfiguration_Device_iPhone_Base
@end

@interface FBSimulatorConfiguration_Device_iPhone5s : FBSimulatorConfiguration_Device_iPhone_Base
@end

@interface FBSimulatorConfiguration_Device_iPhone6 : FBSimulatorConfiguration_Device_iPhone_Base
@end

@interface FBSimulatorConfiguration_Device_iPhone6Plus : FBSimulatorConfiguration_Device_iPhone_Base
@end

@interface FBSimulatorConfiguration_Device_iPhone6S : FBSimulatorConfiguration_Device_iPhone_Base
@end

@interface FBSimulatorConfiguration_Device_iPhone6SPlus : FBSimulatorConfiguration_Device_iPhone_Base
@end

@interface FBSimulatorConfiguration_Device_iPad_Base : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Device>
@end

@interface FBSimulatorConfiguration_Device_iPad2 : FBSimulatorConfiguration_Device_iPad_Base
@end

@interface FBSimulatorConfiguration_Device_iPadRetina : FBSimulatorConfiguration_Device_iPad_Base
@end

@interface FBSimulatorConfiguration_Device_iPadAir : FBSimulatorConfiguration_Device_iPad_Base
@end

@interface FBSimulatorConfiguration_Device_iPadAir2 : FBSimulatorConfiguration_Device_iPad_Base
@end

@interface FBSimulatorConfiguration_Device_iPadPro : FBSimulatorConfiguration_Device_iPad_Base
@end

@interface FBSimulatorConfiguration_Device_tvOS_Base : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Device>
@end

@interface FBSimulatorConfiguration_Device_AppleTV1080p : FBSimulatorConfiguration_Device_tvOS_Base
@end

@interface FBSimulatorConfiguration_Device_watchOS_Base : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_Device>
@end

@interface FBSimulatorConfiguration_Device_AppleWatch38mm : FBSimulatorConfiguration_Device_watchOS_Base
@end

@interface FBSimulatorConfiguration_Device_AppleWatch42mm : FBSimulatorConfiguration_Device_watchOS_Base
@end

#pragma mark OS Versions

@protocol FBSimulatorConfiguration_OS <NSObject>

- (NSString *)name;
- (NSSet *)families;

@end

@interface FBSimulatorConfiguration_iOS_Base : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_OS>
@end

@interface FBSimulatorConfiguration_iOS_7_1 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_8_0 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_8_1 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_8_2 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_8_3 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_8_4 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_9_0 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_9_1 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_9_2 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_iOS_9_3 : FBSimulatorConfiguration_iOS_Base
@end

@interface FBSimulatorConfiguration_tvOS_Base : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_OS>
@end

@interface FBSimulatorConfiguration_tvOS_9_0 : FBSimulatorConfiguration_tvOS_Base
@end

@interface FBSimulatorConfiguration_tvOS_9_1 : FBSimulatorConfiguration_tvOS_Base
@end

@interface FBSimulatorConfiguration_tvOS_9_2 : FBSimulatorConfiguration_tvOS_Base
@end

@interface FBSimulatorConfiguration_watchOS_Base : FBSimulatorConfigurationVariant_Base <FBSimulatorConfiguration_OS>
@end

@interface FBSimulatorConfiguration_watchOS_2_0 : FBSimulatorConfiguration_watchOS_Base
@end

@interface FBSimulatorConfiguration_watchOS_2_1 : FBSimulatorConfiguration_watchOS_Base
@end

@interface FBSimulatorConfiguration_watchOS_2_2 : FBSimulatorConfiguration_watchOS_Base
@end

@interface FBSimulatorConfiguration ()

@property (nonatomic, strong, readwrite) id<FBSimulatorConfiguration_Device> device;
@property (nonatomic, strong, readwrite) id<FBSimulatorConfiguration_OS> os;
@property (nonatomic, copy, readwrite) NSString *auxillaryDirectory;

- (instancetype)updateNamedDevice:(id<FBSimulatorConfiguration_Device>)device;
- (instancetype)updateOSVersion:(id<FBSimulatorConfiguration_OS>)OS;

+ (NSArray *)deviceConfigurations;
+ (NSArray *)OSConfigurations;
+ (NSDictionary *)nameToDevice;
+ (NSDictionary *)nameToOSVersion;

@end
