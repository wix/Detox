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

@class DVTiOSDevice;
@class FBDeviceSet;
@class FBProductBundle;
@class FBTestRunnerConfiguration;
@protocol FBDeviceOperator;
@protocol FBControlCoreLogger;

NS_ASSUME_NONNULL_BEGIN

/**
 Class that wraps DVTAbstractiOSDevice and it's device operator that can perform actions on it.
 */
@interface FBDevice : NSObject <FBiOSTarget>

/**
 The Device Set to which the Device Belongs.
 */
@property (nonatomic, weak, readonly) FBDeviceSet *set;

/**
 The Logger to Log events with.
 */
@property (nonatomic, strong, readonly) id<FBControlCoreLogger> logger;

/**
 The DVTDevice, corresponding to the reciever.
 */
@property (nonatomic, nullable, strong, readonly) DVTiOSDevice *dvtDevice;

/**
 Device operator used to control device
 */
@property (nonatomic, nullable, strong, readonly) id<FBDeviceOperator> deviceOperator;

/**
 Device's name
 */
@property (nonatomic, copy, readonly) NSString *name;

/**
 Device's model name
 */
@property (nonatomic, copy, readonly) NSString *modelName;

/**
 Device's system Version
 */
@property (nonatomic, copy, readonly) NSString *systemVersion;

/**
 Architectures suported by device
 */
@property (nonatomic, copy, readonly) NSSet *supportedArchitectures;

/**
 Starts test manager daemon service

 @return AMDServiceConnection if the operation succeeds, otherwise NULL.
 */
- (CFTypeRef)startTestManagerServiceWithError:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
