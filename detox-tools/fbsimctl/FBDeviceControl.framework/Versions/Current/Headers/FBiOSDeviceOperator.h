/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <XCTestBootstrap/FBDeviceOperator.h>

@class FBDevice;

/**
 A 'Device Operator' Implementation for providing the necessary functionality to XCTestBoostrap for Physical Devices.
 Uses the Xcode Frameworks DVTFoundation and IDEiOSSupportCore.ideplugin to control a DVTiOSDevice instance directly.
 */
@interface FBiOSDeviceOperator : NSObject <FBDeviceOperator>

/**
 Creates a new Device Operator for the provided Device.

 @param device the Device to create the Operator for.
 @return a new FBiOSDeviceOperator instance.
 */
+ (instancetype)forDevice:(FBDevice *)device;

@end
