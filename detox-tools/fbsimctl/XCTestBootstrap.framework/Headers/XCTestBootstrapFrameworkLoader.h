/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@protocol FBControlCoreLogger;

/**
 Framework and Class Loading for XCTestBoostrap.
 */
@interface XCTestBootstrapFrameworkLoader : NSObject

/**
 Loads the Relevant Private Frameworks for ensuring the proper operation of XCTestBootsrap.
 Aborts if the loading fails.
 */
+ (void)initializeTestingEnvironment;

/**
 Loads the Relevant Private Frameworks for ensuring the proper operation of XCTestBootsrap.

 @param logger the logger to log to for Framework Loading activity.
 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
+ (BOOL)loadTestingFrameworks:(id<FBControlCoreLogger>)logger error:(NSError **)error;

@end
