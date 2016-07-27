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
 Parsers the Mach-O Header of a binary.
 */
@interface FBBinaryParser : NSObject

/**
 Parses the Mach-O Header of a binary, returning a set of archs.

 @param binaryPath the Path of the Binary to parse.
 @param error an error out for any error that occurred.
 @return a Set of archs if any could be found, nil on error.
 */
+ (NSSet *)architecturesForBinaryAtPath:(NSString *)binaryPath error:(NSError **)error;

@end
