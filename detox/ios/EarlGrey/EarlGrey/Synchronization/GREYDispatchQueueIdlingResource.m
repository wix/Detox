//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import "Synchronization/GREYDispatchQueueIdlingResource.h"

#include <dlfcn.h>
#include <fishhook.h>
#include <libkern/OSAtomic.h>

#import "Common/GREYConfiguration.h"
#import "Common/GREYDefines.h"

/**
 *  A pointer to the original implementation of @c dispatch_after.
 */
static void (*grey_original_dispatch_after)(dispatch_time_t when,
                                            dispatch_queue_t queue,
                                            dispatch_block_t block);
/**
 *  A pointer to the original implementation of @c dispatch_async.
 */
static void (*grey_original_dispatch_async)(dispatch_queue_t queue, dispatch_block_t block);
/**
 *  A pointer to the original implementation of @c dispatch_sync.
 */
static void (*grey_original_dispatch_sync)(dispatch_queue_t queue, dispatch_block_t block);

/**
 *  Used to find idling resource corresponding to a dispatch queue, if one exists.
 */
static NSMapTable *gDispatchQueueToIdlingResource;

@interface GREYDispatchQueueIdlingResource ()

- (void)grey_dispatchAfterCallWithTime:(dispatch_time_t)when block:(dispatch_block_t)block;
- (void)grey_dispatchAsyncCallWithBlock:(dispatch_block_t)block;
- (void)grey_dispatchSyncCallWithBlock:(dispatch_block_t)block;

@end

/**
 * @return The GREYDispatchQueueIdlingResource associated with @c queue or @c nil if there is none.
 */
static GREYDispatchQueueIdlingResource *grey_getIdlingResourceForQueue(dispatch_queue_t queue) {
  GREYDispatchQueueIdlingResource *resource = nil;
  @synchronized(gDispatchQueueToIdlingResource) {
    resource = [gDispatchQueueToIdlingResource objectForKey:queue];
  }
  return resource;
}

/**
 *  Overriden implementation of @c dispatch_after that calls into the idling resource, if one is
 *  found for the dispatch queue passed in.
 *
 *  @param when  Same as @c dispatch_after's @c when.
 *  @param queue Same as @c dispatch_after's @c queue.
 *  @param block Same as @c dispatch_after's @c block.
 */
static void grey_dispatch_after(dispatch_time_t when,
                                dispatch_queue_t queue,
                                dispatch_block_t block) {
  GREYDispatchQueueIdlingResource *resource = grey_getIdlingResourceForQueue(queue);
  if (resource) {
    [resource grey_dispatchAfterCallWithTime:when block:block];
  } else {
    grey_original_dispatch_after(when, queue, block);
  }
}

/**
 *  Overriden implementation of @c dispatch_async that calls into the idling resource, if one is
 *  found for the dispatch queue passed in.
 *
 *  @param queue Same as @c dispatch_async @c queue.
 *  @param block Same as @c dispatch_async @c block.
 */
static void grey_dispatch_async(dispatch_queue_t queue, dispatch_block_t block) {
  GREYDispatchQueueIdlingResource *resource = grey_getIdlingResourceForQueue(queue);
  if (resource) {
    [resource grey_dispatchAsyncCallWithBlock:block];
  } else {
    grey_original_dispatch_async(queue, block);
  }
}

/**
 *  Overriden implementation of @c dispatch_sync that calls into the idling resource, if one is
 *  found for the dispatch queue passed in.
 *
 *  @param queue Same as @c dispatch_sync @c queue.
 *  @param block Same as @c dispatch_sync @c block.
 */
static void grey_dispatch_sync(dispatch_queue_t queue, dispatch_block_t block) {
  GREYDispatchQueueIdlingResource *resource = grey_getIdlingResourceForQueue(queue);
  if (resource) {
    [resource grey_dispatchSyncCallWithBlock:block];
  } else {
    grey_original_dispatch_sync(queue, block);
  }
}

@implementation GREYDispatchQueueIdlingResource {
  NSString *_idlingResourceName;
  __weak dispatch_queue_t _dispatchQueue;
  __block int32_t _pendingBlocks;
}

+ (void)load {
  @autoreleasepool {
    gDispatchQueueToIdlingResource = [NSMapTable weakToWeakObjectsMapTable];

    dispatch_queue_t dummyQueue = dispatch_queue_create("GREYDummyQueue", DISPATCH_QUEUE_SERIAL);
    NSAssert(dummyQueue, @"dummmyQueue must not be nil");

    // Use dlsym to get the original pointer because of
    // https://github.com/facebook/fishhook/issues/21
    grey_original_dispatch_after = dlsym(RTLD_DEFAULT, "dispatch_after");
    grey_original_dispatch_async = dlsym(RTLD_DEFAULT, "dispatch_async");
    grey_original_dispatch_sync = dlsym(RTLD_DEFAULT, "dispatch_sync");
    NSAssert(grey_original_dispatch_after, @"Pointer to dispatch_after must not be NULL");
    NSAssert(grey_original_dispatch_async, @"Pointer to dispatch_async must not be NULL");
    NSAssert(grey_original_dispatch_sync, @"Pointer to dispatch_sync must not be NULL");

    // Rebind symbols dispatch_* to point to our own implementation.
    struct rebinding rebindings[] = {
      {"dispatch_after", grey_dispatch_after, NULL},
      {"dispatch_async", grey_dispatch_async, NULL},
      {"dispatch_sync", grey_dispatch_sync, NULL},
    };
    int failure = rebind_symbols(rebindings, sizeof(rebindings) / sizeof(rebindings[0]));
    NSAssert(!failure, @"rebinding symbols failed");
  }
}

#pragma mark - Methods Only For Testing

/**
 *  @return the GREYIdlingResource for currently tracked dispatch @c queue.
 */
+ (instancetype)grey_resourceForCurrentlyTrackedDispatchQueue:(dispatch_queue_t)queue {
  return grey_getIdlingResourceForQueue(queue);
}

# pragma mark -

+ (instancetype)resourceWithDispatchQueue:(dispatch_queue_t)queue name:(NSString *)name {
  return [[GREYDispatchQueueIdlingResource alloc] initWithDispatchQueue:queue name:name];
}

- (instancetype)initWithDispatchQueue:(dispatch_queue_t)queue name:(NSString *)name {
  NSParameterAssert(queue);
  NSParameterAssert(name);

  self = [super init];
  if (self) {
    _idlingResourceName = [name copy];
    _dispatchQueue = queue;

    @synchronized(gDispatchQueueToIdlingResource) {
      // TODO: Support a use case where a queue is tracked more than once.
      id<GREYIdlingResource> resource = grey_getIdlingResourceForQueue(queue);
      NSAssert(!resource, @"Queue \"%@\" is already being tracked by %@", queue, resource);
      // Register this resource with dispatch queue to idling resource map.
      [gDispatchQueueToIdlingResource setObject:self forKey:queue];
    }
  }

  return self;
}

#pragma mark - GREYIdlingResource

- (NSString *)idlingResourceName {
  return _idlingResourceName;
}

- (NSString *)idlingResourceDescription {
  return _idlingResourceName;
}

- (BOOL)isIdleNow {
  NSAssert(_pendingBlocks >= 0, @"_pendingBlocks must not be negative");
  BOOL isIdle = OSAtomicCompareAndSwap32Barrier(0, 0, &_pendingBlocks);
  return isIdle;
}

#pragma mark - Private

- (void)grey_dispatchAfterCallWithTime:(dispatch_time_t)when block:(dispatch_block_t)block {
  CFTimeInterval maxDelay = GREY_CONFIG_DOUBLE(kGREYConfigKeyDispatchAfterMaxTrackableDelay);
  dispatch_time_t trackDelay = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(maxDelay * NSEC_PER_SEC));

  if (trackDelay >= when) {
    OSAtomicIncrement32Barrier(&_pendingBlocks);
    grey_original_dispatch_after(when, _dispatchQueue, ^{
      block();
      OSAtomicDecrement32Barrier(&_pendingBlocks);
    });
  } else {
    grey_original_dispatch_after(when, _dispatchQueue, block);
  }
}

- (void)grey_dispatchAsyncCallWithBlock:(dispatch_block_t)block {
  OSAtomicIncrement32Barrier(&_pendingBlocks);
  grey_original_dispatch_async(_dispatchQueue, ^{
    block();
    OSAtomicDecrement32Barrier(&_pendingBlocks);
  });
}

- (void)grey_dispatchSyncCallWithBlock:(dispatch_block_t)block {
  OSAtomicIncrement32Barrier(&_pendingBlocks);
  grey_original_dispatch_sync(_dispatchQueue, ^{
    block();
    OSAtomicDecrement32Barrier(&_pendingBlocks);
  });
}

@end
