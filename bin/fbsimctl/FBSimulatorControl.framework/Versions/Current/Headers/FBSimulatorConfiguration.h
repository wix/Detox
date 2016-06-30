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

NS_ASSUME_NONNULL_BEGIN

/**
 A Value object that represents the Configuration of a iPhone, iPad, Watch or TV Simulator.

 Class is designed around maximum convenience for specifying a configuration.
 For example to specify an iPad 2 on iOS 8.2:
 `FBSimulatorConfiguration.iPad2.iOS_8_2`.

 It is also possible to specify configurations based on a NSString.
 This is helpful when creating a device from something specified in an Environment Variable:
 `[FBSimulatorConfiguration.iPhone5 iOS:NSProcessInfo.processInfo.environment[@"TARGET_OS"]]`
 */
@interface FBSimulatorConfiguration : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBDebugDescribeable>

#pragma mark Properties

/**
 The Device Configuration.
 */
@property (nonatomic, strong, readonly) id<FBControlCoreConfiguration_Device> device;

/**
 The OS Configuration.
 */
@property (nonatomic, strong, readonly) id<FBControlCoreConfiguration_OS> os;

/**
 The Name of the Device to Simulate. Must not be nil.
 */
@property (nonatomic, copy, readonly) NSString *deviceName;

/**
 A String Representation of the OS Version of the Simulator. Must not be nil.
 */
@property (nonatomic, copy, readonly) NSString *osVersionString;

/**
 The Location to store auxillary files in.
 Auxillary files are stored per-simulator, so will be nested inside directories for each Simulator.
 If no path is provided, a default Auxillary directory inside the Simulator's data directory will be used.
 */
@property (nonatomic, copy, nullable, readonly) NSString *auxillaryDirectory;

/**
 Returns the Default Configuration.
 The OS Version is derived from the SDK Version.
 */
+ (instancetype)defaultConfiguration;

#pragma mark - Devices

/**
 An OS with the given configuration.
 */
+ (instancetype)withDevice:(id<FBControlCoreConfiguration_Device>)device;
- (instancetype)withDevice:(id<FBControlCoreConfiguration_Device>)device;

/**
 A Device with the provided name.
 Will return nil, if no device with the given name could be found.
 */
+ (nullable instancetype)withDeviceNamed:(NSString *)deviceName;
- (nullable instancetype)withDeviceNamed:(NSString *)deviceName;

#pragma mark iPhone Devices

/**
 An iPhone 4s.
 */
+ (instancetype)iPhone4s;
- (instancetype)iPhone4s;

/**
 An iPhone 5.
 */
+ (instancetype)iPhone5;
- (instancetype)iPhone5;

/**
 An iPhone 5s.
 */
+ (instancetype)iPhone5s;
- (instancetype)iPhone5s;

/**
 An iPhone 6.
 */
+ (instancetype)iPhone6;
- (instancetype)iPhone6;

/**
 An iPhone 6s.
 */
+ (instancetype)iPhone6s;
- (instancetype)iPhone6s;

/**
 An iPhone 6 Plus.
 */
+ (instancetype)iPhone6Plus;
- (instancetype)iPhone6Plus;

/**
 An iPhone 6s Plus.
 */
+ (instancetype)iPhone6sPlus;
- (instancetype)iPhone6sPlus;

#pragma mark iPad Devices

/**
 An iPad 2.
 */
+ (instancetype)iPad2;
- (instancetype)iPad2;

/**
 An iPad Retina.
 */
+ (instancetype)iPadRetina;
- (instancetype)iPadRetina;

/**
 An iPad Pro.
 */
+ (instancetype)iPadPro;
- (instancetype)iPadPro;

/**
 An iPad Air.
 */
+ (instancetype)iPadAir;
- (instancetype)iPadAir;

/**
 An iPad Air.
 */
+ (instancetype)iPadAir2;
- (instancetype)iPadAir2;

#pragma mark Watch Devices

/**
 The 38mm Apple Watch.
 */
+ (instancetype)watch38mm;
- (instancetype)watch38mm;

/**
 The 42mm Apple Watch.
 */
+ (instancetype)watch42mm;
- (instancetype)watch42mm;

#pragma mark Apple TV Devices

/**
 The 1080p Apple TV.
 */
+ (instancetype)appleTV1080p;
- (instancetype)appleTV1080p;

#pragma mark - OS Versions

/**
 An OS with the given configuration.
 */
+ (instancetype)withOS:(id<FBControlCoreConfiguration_OS>)os;
- (instancetype)withOS:(id<FBControlCoreConfiguration_OS>)os;

/**
 Device with the given OS version.
 Will return nil, if no OS with the given name could be found.
 */
+ (nullable instancetype)withOSNamed:(NSString *)osName;

/**
 Device with the given OS version.
 Will return nil, if no OS with the given name could be found.
 */
- (nullable instancetype)withOSNamed:(NSString *)osName;

#pragma mark iOS Versions

/**
 iOS 7.1
 */
- (instancetype)iOS_7_1;

/**
 iOS 8.0
 */
- (instancetype)iOS_8_0;

/**
 iOS 8.1
 */
- (instancetype)iOS_8_1;

/**
 iOS 8.2
 */
- (instancetype)iOS_8_2;

/**
 iOS 8.3
 */
- (instancetype)iOS_8_3;

/**
 iOS 8.4
 */
- (instancetype)iOS_8_4;

/**
 iOS 9.0
 */
- (instancetype)iOS_9_0;

/**
 iOS 9.1
 */
- (instancetype)iOS_9_1;

/**
 iOS 9.2
 */
- (instancetype)iOS_9_2;

/**
 iOS 9.3
 */
- (instancetype)iOS_9_3;

#pragma mark tvOS Versions

/**
 tvOS 9.0
 */
- (instancetype)tvOS_9_0;

/**
 tvOS 9.1
 */
- (instancetype)tvOS_9_1;

/**
 tvOS 9.2
 */
- (instancetype)tvOS_9_2;

#pragma mark watchOS Versions

/**
 watchOS 2.0
 */
- (instancetype)watchOS_2_0;

/**
 watchOS 2.1
 */
- (instancetype)watchOS_2_1;

/**
 watchOS 2.2
 */
- (instancetype)watchOS_2_2;

#pragma mark Auxillary Directory

/**
 Updates the Auxillary Directory.
 */
- (instancetype)withAuxillaryDirectory:(NSString *)auxillaryDirectory;

@end

NS_ASSUME_NONNULL_END
