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
 Helpers for information about of Collections.
 */
@interface FBCollectionInformation : NSObject

/**
 Creates a One-Line Array description from the array, using the -[NSObject description] keypath.

 @param array the Array to construct a description for.
 */
+ (NSString *)oneLineDescriptionFromArray:(NSArray *)array;

/**
 Creates a One-Line Array description from the array, with a given keyPath.

 @param array the Array to construct a description for.
 @param keyPath the Key Path, to obtain a String description from.
 */
+ (NSString *)oneLineDescriptionFromArray:(NSArray *)array atKeyPath:(NSString *)keyPath;

/**
 Creates a One-Line Array description from the Dictionary.

 @param dictionary the Dictionary to construct a description for.
 */
+ (NSString *)oneLineDescriptionFromDictionary:(NSDictionary *)dictionary;

/**
 Confirms that the collection is heterogeneous of a given class.

 @param array the array to check.
 @param cls the class that all elements in the array should belong to.
 @return YES if hetrogeneous, NO otherwise.
 */
+ (BOOL)isArrayHeterogeneous:(NSArray *)array withClass:(Class)cls;

/**
 Confirms that the collection is heterogeneous of a given class.

 @param dictionary the dictionary to check
 @param keyCls the class that all keys in the dictionary should belong to.
 @param valueCls the class that all values in the dictionary should be belong to.
 @return YES if hetrogeneous, NO otherwise.
 */
+ (BOOL)isDictionaryHeterogeneous:(NSDictionary *)dictionary keyClass:(Class)keyCls valueClass:(Class)valueCls;

@end

NS_ASSUME_NONNULL_END
