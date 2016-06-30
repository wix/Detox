/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Some Utilities for fetching Substrings.
 */
@interface FBSubstringUtilities : NSObject

/**
 Finds the next string after an occurence of a needle.

 @param needle the string to search in.
 @param haystack the substring to search for.
 @return the Substring after the needle if successful, the original string if the needle was not found.
 */
+ (NSString *)substringAfterNeedle:(NSString *)needle inHaystack:(NSString *)haystack;

/**
 Returns the substring after a character count

 @param string the string to split.
 @param characterCount the character to start from
 @return the Substring after the character count, an empty string if the count is greater than the length.
 */
+ (NSString *)substringOf:(NSString *)string withLastCharacterCount:(NSUInteger)characterCount;

@end

NS_ASSUME_NONNULL_END
