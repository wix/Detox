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
 A Simple Queue that Pushes to the end and pops from the front.
 Evicts from the front when capacity is reached.
 */
@interface FBCapacityQueue : NSObject

/**
 Constructs a queue with a capacity. Zero means no capacity limit.

 @param capacity the capacity of the queue.
 @return a new Capacity Queue.
 */
+ (instancetype)withCapacity:(NSUInteger)capacity;

/**
 Pushes an item to the end of the queue.

 @param item the item to push.
 @return the item that was evicted if capacity was reached.
 */
- (id)push:(id)item;

/**
 Pops an item from the front of the front of the queue.

 @return the item at the front of the queue, nil otherwise.
 */
- (id)pop;

/**
 Pops all items from the queue.

 @return an Array of all the items popped from the queue.
 */
- (NSArray *)popAll;

/**
 The count of the queue.

 @return the count of items in the queue
 */
- (NSUInteger)count;

@end
