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
 Utility methods for files.
 */
@interface FBFileFinder : NSObject

/**
 Recursively searches the provided directory attempting finding all files with the provided filenames.

 @param filenames the files to search for. Must not be nil.
 @param directory the directory to search from. Must not be nil.
 @return an array of all found files.
 */
+ (NSArray<NSString *> *)recursiveFindFiles:(NSArray<NSString *> *)filenames inDirectory:(NSString *)directory;

/**
 Recursively searches the provided directory, finding the most recent files with the provided filenames.

 @param filenames the files to search for. Must not be nil.
 @param directory the directory to search from. Must not be nil.
 @return an array of all found files.
 */
+ (NSArray<NSString *> *)mostRecentFindFiles:(NSArray<NSString *> *)filenames inDirectory:(NSString *)directory;

/**
 Like -[NSFileManager contentsOfDirectoryAtPath:error:], except that the base path is prepended to all subpaths.

 @param basePath the base path to construct
 @return an array of all found files.
 */
+ (NSArray<NSString *> *)contentsOfDirectoryWithBasePath:(NSString *)basePath;

@end
