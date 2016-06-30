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
 Conveniences for concurent collection operations.
 The Predicates and Blocks Passed to these functions must work in a thread-safe manner, inspecting immutable values is the way to go.
 */
@interface FBConcurrentCollectionOperations : NSObject

/**
 Generate an array of objects from indeces. Indeces where nil is returned will contain `NSNull.null`

 @param count the number of generations to execute
 @param block the block to generate objects from.
 @return a Generated Array of Objects.
 */
+ (NSArray *)generate:(NSUInteger)count withBlock:( id(^)(NSUInteger index) )block;

/**
 Map an array of objects concurrently.

 @param array the array to map.
 @param block the block to map objects with.
 @return a Mapped Array of Objects.
 */
+ (NSArray *)map:(NSArray *)array withBlock:( id(^)(id object) )block;

/**
 Filter an array of objects concurrently.

 @param array the array to map/filter.
 @param predicate the predicate to filter the objects with, before they are mapped.
 @return a Filter Array of Objects.
 */
+ (NSArray *)filter:(NSArray *)array predicate:(NSPredicate *)predicate;

/**
 Map and then filter an array of objects concurrently.

 @param array the array to map/filter.
 @param block the block to map objects with.
 @param predicate the predicate to filter the mapped objects with.
 @return a Mapped then Filtered array of objects.
 */
+ (NSArray *)mapFilter:(NSArray *)array map:(id (^)(id))block predicate:(NSPredicate *)predicate;

/**
 Filter then map an array of objects concurrently.

 @param array the array to map/filter.
 @param predicate the predicate to filter the objects with, before they are mapped.
 @param block the block to map objects with.
 @return a Filtered then Mapped array of objects.
 */
+ (NSArray *)filterMap:(NSArray *)array predicate:(NSPredicate *)predicate map:(id (^)(id))block;

@end
