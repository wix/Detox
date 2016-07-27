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
 Protocol for Codesigning Bundles.
 */
@protocol FBCodesignProvider <NSObject>

/**
 Request to codesign bundle at given path

 @param bundlePath path to bundle that should be signed
 @return YES if operation was successful
 */
- (BOOL)signBundleAtPath:(NSString *)bundlePath;

@end
