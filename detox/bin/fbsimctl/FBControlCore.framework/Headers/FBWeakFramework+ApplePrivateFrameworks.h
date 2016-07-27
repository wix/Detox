/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBControlCore/FBWeakFramework.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Creates FBWeakFrameworks that represents Apple's private frameworks with paths relative to developer directory (pointed by `xcode-select -p`).
 */
@interface FBWeakFramework (ApplePrivateFrameworks)

/**
 XCode Frameworks.
 */
+ (instancetype)CoreSimulator;
+ (instancetype)SimulatorKit;
+ (instancetype)DTXConnectionServices;
+ (instancetype)DVTFoundation;
+ (instancetype)IDEFoundation;
+ (instancetype)IDEiOSSupportCore;
+ (instancetype)IBAutolayoutFoundation;
+ (instancetype)IDEKit;
+ (instancetype)IDESourceEditor;

/**
 XCTest framework for MacOSX
 */
+ (instancetype)XCTest;

/**
 Frameworks bundled with the 'Apple Configuration' App
 */
+ (instancetype)ConfigurationUtilityKit;
+ (instancetype)ConfigurationProfile;

/**
 System Private Frameworks
 */
+ (instancetype)MobileDevice;

@end

NS_ASSUME_NONNULL_END
