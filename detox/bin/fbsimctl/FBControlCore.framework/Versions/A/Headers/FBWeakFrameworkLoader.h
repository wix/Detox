/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBWeakFramework;
@protocol FBControlCoreLogger;

/**
 A Utility Class for loading weak-linked Frameworks at runtime.
 */
@interface FBWeakFrameworkLoader : NSObject

/**
 Loads a list of Frameworks.
 Will avoid re-loading already loaded Frameworks.
 Will also completely bypass loading of user plugins to prevent compatability issues.

 @param weakFrameworks a list of frameworks to load
 @param logger a logger for logging framework loading activities.
 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
+ (BOOL)loadPrivateFrameworks:(NSArray<FBWeakFramework *> *)weakFrameworks logger:(id<FBControlCoreLogger>)logger error:(NSError **)error;

@end
