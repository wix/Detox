/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBTestManagerAPIMediator;

/**
 A Delegate for providing the Test Manager Mediator a way of interacting iOS Processes.
 */
@protocol FBTestManagerProcessInteractionDelegate <NSObject>

/**
 Request to launch an Application Process.

 @param mediator a mediator requesting launch
 @param path a path for application to launch
 @param bundleID a bundleID for application to launch
 @param arguments arguments that application should be launched with
 @param environmentVariables environment variables that application should be launched with
 @param error error for error handling
 @return YES if the request was successful, otherwise NO.
 */
- (BOOL)testManagerMediator:(FBTestManagerAPIMediator *)mediator launchProcessWithPath:(NSString *)path bundleID:(NSString *)bundleID arguments:(NSArray<NSString *> *)arguments environmentVariables:(NSDictionary<NSString *, NSString *> *)environmentVariables error:(NSError **)error;

/**
 Request to kill an application with bundle id

 @param mediator a mediator requesting kill
 @param bundleID a bundle id of application to kill
 @param error error for error handling
 @return YES if the request was successful, otherwise NO.
 */
- (BOOL)testManagerMediator:(FBTestManagerAPIMediator *)mediator killApplicationWithBundleID:(NSString *)bundleID error:(NSError **)error;

@end
