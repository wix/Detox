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
 Additional Predicates for FBControlCore.
 */
@interface NSPredicate (FBControlCore)

/**
 Returns a Predicate that matches against video file paths.
 */
+ (NSPredicate *)predicateForVideoPaths;

/**
 Returns a Predicate that matches against photo file paths.
 */
+ (NSPredicate *)predicateForPhotoPaths;

/**
 Returns a Predicate that matches against photo and video paths.
 */
+ (NSPredicate *)predicateForMediaPaths;

/**
 Returns a that will filter out null/NSNull values.
 */
+ (NSPredicate *)notNullPredicate;

@end
