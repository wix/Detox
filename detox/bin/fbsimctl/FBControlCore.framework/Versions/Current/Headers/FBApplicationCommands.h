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
 Defines an interface for interacting with iOS Applications.
 */
@protocol FBApplicationCommands <NSObject>

/**
 Installs application at given path on the host.

 @param path the file path of the Application Bundle on the host.
 @param error an error out for any error that occurs.
 @return YES if the command succeeds, NO otherwise,
 */
- (BOOL)installApplicationWithPath:(NSString *)path error:(NSError **)error;

/**
 Queries to see if an Application is installed on iOS.

 @param bundleID The Bundle ID of the application.
 @param error an error out for any error that occurs.
 @return YES if the command succeeds, NO otherwise,
 */
- (BOOL)isApplicationInstalledWithBundleID:(NSString *)bundleID error:(NSError **)error;

@end
