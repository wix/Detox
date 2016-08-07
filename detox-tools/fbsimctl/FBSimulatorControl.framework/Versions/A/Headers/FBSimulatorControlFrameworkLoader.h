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

NS_ASSUME_NONNULL_BEGIN

/**
 A Class for handling Framework Loading of Private Frameworks that FBSimulatorControl depends on.
 */
@interface FBSimulatorControlFrameworkLoader : NSObject

#pragma mark Framework Loading

/**
 Loads all of the Frameworks upon which FBSimulatorControl depends.
 This method *must* be called before any class in FBSimulatorControl can be used.
 In order to do this automatically, set `FBSIMULATORCONTROL_AUTOMATICALLY_LOAD_FRAMEWORKS`.

 @param logger the Logger to log events to.
 @param error any error that occurred during performing the preconditions.
 @returns YES if FBSimulatorControl is usable, NO otherwise.
 */
+ (BOOL)loadPrivateFrameworks:(nullable id<FBControlCoreLogger>)logger error:(NSError **)error;

/**
 Calls +[FBSimulatorControl loadPrivateFrameworks:error], aborting in the event the Frameworks could not be loaded
 */
+ (void)loadPrivateFrameworksOrAbort;

@end

NS_ASSUME_NONNULL_END
