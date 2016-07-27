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

@protocol FBControlCoreLogger;

/**
 Represents framework that FBControlCore is dependent on
 */
@interface FBWeakFramework : NSObject

/**
 Creates and returns FBWeakFramework relative to Xcode with the given relativePath.

 @param relativePath Developer Directory relative path to the framework.
 @return a Weak Framework with given relativePath and list of checked class names
 */
+ (instancetype)xcodeFrameworkWithRelativePath:(NSString *)relativePath;

/**
 Creates and returns FBWeakFramework relative to Xcode with the given relativePath and list of checked class names.

 @param relativePath Developer Directory relative path to the framework.
 @param requiredClassNames list of class names used to determin if framework load was successful
 @return a Weak Framework with given relativePath and list of checked class names
 */
+ (instancetype)xcodeFrameworkWithRelativePath:(NSString *)relativePath requiredClassNames:(NSArray<NSString *> *)requiredClassNames;

/**
 Creates and returns FBWeakFramework relative to Xcode with the given relativePath, list of checked class names and list of pre-loaded frameworks.

 @param relativePath Developer Directory relative path to the framework.
 @param requiredClassNames list of class names used to determin if framework load was successful
 @param requiredFrameworks list of frameworks, that should be loaded before this framework loads
 @return a Weak Framework with given relativePath, list of checked class names and list of pre-loaded frameworks
 */
+ (instancetype)xcodeFrameworkWithRelativePath:(NSString *)relativePath requiredClassNames:(NSArray<NSString *> *)requiredClassNames requiredFrameworks:(NSArray<FBWeakFramework *> *)requiredFrameworks;

/**
 Creates and returns FBWeakFramework relative to the 'Apple Configuration' App with the given relativePath, list of checked class names.

 @param relativePath Developer Directory relative path to the framework.
 @param requiredClassNames list of class names used to determin if framework load was successful
 @return a Weak Framework with given relativePath, list of checked class names and list of pre-loaded frameworks
 */
+ (instancetype)appleConfigurationFrameworkWithRelativePath:(NSString *)relativePath requiredClassNames:(NSArray<NSString *> *)requiredClassNames;

/**
 Creates and returns FBWeakFramework relative to the 'Apple Configuration' App with the given relativePath, list of checked class names and list of pre-loaded frameworks.

 @param relativePath Developer Directory relative path to the framework.
 @param requiredClassNames list of class names used to determin if framework load was successful
 @param requiredFrameworks list of frameworks, that should be loaded before this framework loads
 @return a Weak Framework with given relativePath, list of checked class names and list of pre-loaded frameworks
 */
+ (instancetype)appleConfigurationFrameworkWithRelativePath:(NSString *)relativePath requiredClassNames:(NSArray<NSString *> *)requiredClassNames requiredFrameworks:(NSArray<FBWeakFramework *> *)requiredFrameworks;

/**
  Creates and returns FBWeakFramework with the provided absolute path

  @param absolutePath The Absolute Path of the Framework.
  @param requiredClassNames list of class names used to determin if framework load was successful
  @return a Weak Framework with given relativePath, list of checked class names and list of pre-loaded frameworks
*/
+ (instancetype)frameworkWithPath:(NSString *)absolutePath requiredClassNames:(NSArray<NSString *> *)requiredClassNames;

/**
 Loads framework by:
 - Checking if framework is already loaded by checking existance of classes from requiredClassNames list
 - If not, loads all frameworks from requiredFrameworks list
 - Loads framework bundle
 - If it fails due to missing framework, it will try to find in fallbackDirectories and load it
 - Makes sanity check for existance of classes from requiredClassNames list
 - Provide a sanity check that any preloaded Private Frameworks match the current xcode-select version

 @param logger a logger for logging framework loading activities.
 @param error an error out for any error that occurs.
 @return YES if successful, NO otherwise.
 */
- (BOOL)loadWithLogger:(id<FBControlCoreLogger>)logger error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
