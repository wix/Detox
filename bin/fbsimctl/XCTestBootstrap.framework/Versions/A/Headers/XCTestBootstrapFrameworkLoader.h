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
 Framework and Class Loading for XCTestBoostrap.
 */
@interface XCTestBootstrapFrameworkLoader : NSObject

/**
 Loads the Relevant Private Frameworks for ensuring the proper operation of XCTestBootsrap.
 */
+ (void)initializeTestingEnvironment;

/**
 Raises the Log Level to debug for DVT relevant Private Frameworks.
 */
+ (void)enableDVTDebugLogging;

@end
