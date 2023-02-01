//
//  Swiftier.h
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 11/22/17.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#ifndef Swiftier_h
#define Swiftier_h

#ifndef DTX_NOTHROW
#define DTX_NOTHROW __attribute__((__nothrow__))
#endif
#ifndef DTX_ALWAYS_INLINE
#define DTX_ALWAYS_INLINE inline __attribute__((__always_inline__))
#endif
#ifndef DTX_WARN_UNUSED_RESULT
#define DTX_WARN_UNUSED_RESULT __attribute__((__warn_unused_result__))
#endif

#define dtx_likely(x) __builtin_expect(x, 1)
#define dtx_unlikely(x) __builtin_expect(x, 0)

#if ! defined(__cplusplus)
#import <stdatomic.h>

#if ! defined(thread_local)
#define thread_local _Thread_local
#endif

#if ! defined(__cplusplus) && ! defined(auto)
#define auto __auto_type
#endif
#endif

typedef _Atomic(void*) atomic_voidptr;
typedef _Atomic(const void*) atomic_constvoidptr;
typedef _Atomic(double) atomic_double;

#if __has_include(<mach/mach_types.h>)
#import <mach/mach_types.h>
typedef _Atomic(thread_t) atomic_thread;
#endif

#ifdef __OBJC__
#if __has_include(<Foundation/Foundation.h>)
#import <Foundation/Foundation.h>
#endif
typedef _Atomic(id) atomic_id;
typedef _Atomic(NSTimeInterval) atomic_nstimeinterval;
typedef _Atomic(CFRunLoopRef) atomic_cfrunloop;
#endif
#endif

#define dtx_defer_block_name_with_prefix(prefix, suffix) prefix ## suffix
#define dtx_defer_block_name(suffix) dtx_defer_block_name_with_prefix(defer_, suffix)
#define dtx_defer __strong void(^dtx_defer_block_name(__LINE__))(void) __attribute__((cleanup(dtx_defer_cleanup_block), unused)) = ^
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
static void dtx_defer_cleanup_block(__strong void(^*block)(void)) {
	(*block)();
}
#pragma clang diagnostic pop

#ifdef __OBJC__
#define __superload load { @autoreleasepool { [self class]; } }\
+ (void)initialize

#define NS(x) ((__bridge id)x)
#define CF(x) ((__bridge CFTypeRef)x)
#define PTR(x) ((__bridge void*)x)

#if ! defined(__cplusplus)
#ifndef swap
#define swap(x, y) do { typeof(x) t = x; x = y; y = t; }while(0)
#endif
#endif

DTX_ALWAYS_INLINE
double DTXDoubleWithMaxFractionLength(double n, NSUInteger k)
{
	double p = pow(10.0, k);
	return round(n * p) / p;
}

#ifdef __OBJC__

@interface NSArray <ElementType> (PSPDFSafeCopy)
- (NSArray <ElementType> *)copy;
- (NSMutableArray <ElementType> *)mutableCopy;
@end

@interface NSSet <ElementType> (PSPDFSafeCopy)
- (NSSet <ElementType> *)copy;
- (NSMutableSet <ElementType> *)mutableCopy;
@end

@interface NSDictionary <KeyType, ValueType> (PSPDFSafeCopy)
- (NSDictionary <KeyType, ValueType> *)copy;
- (NSMutableDictionary <KeyType, ValueType> *)mutableCopy;
@end

@interface NSOrderedSet <ElementType> (PSPDFSafeCopy)
- (NSOrderedSet <ElementType> *)copy;
- (NSMutableOrderedSet <ElementType> *)mutableCopy;
@end

@interface NSHashTable <ElementType> (PSPDFSafeCopy)
- (NSHashTable <ElementType> *)copy;
@end

@interface NSMapTable <KeyType, ValueType> (PSPDFSafeCopy)
- (NSMapTable <KeyType, ValueType> *)copy;
@end

#endif

#define CLANG_IGNORE_HELPER0(x) #x
#define CLANG_IGNORE_HELPER1(x) CLANG_IGNORE_HELPER0(clang diagnostic ignored x)
#define CLANG_IGNORE_HELPER2(y) CLANG_IGNORE_HELPER1(#y)
#define CLANG_POP _Pragma("clang diagnostic pop")
#define CLANG_IGNORE(x)\
    _Pragma("clang diagnostic push");\
    _Pragma(CLANG_IGNORE_HELPER2(x))

#define pthread_mutex_lock_deferred_unlock(mutex) \
pthread_mutex_lock(mutex);\
dtx_defer {\
	pthread_mutex_unlock(mutex);\
};

#define free_if_needed(x) do { if(x != NULL) { free(x); }} while(0)

#define dtx_dispatch_queue_create_autoreleasing(name, attr) dispatch_queue_create(name, dispatch_queue_attr_make_with_autorelease_frequency(attr, DISPATCH_AUTORELEASE_FREQUENCY_WORK_ITEM))

#if __has_include("DTXSwizzlingHelper.h")
#import "DTXSwizzlingHelper.h"
#endif

#define if_unavailable(...) if(@available(__VA_ARGS__)) {} else

#if defined(__IPHONE_14_0) || defined(__MAC_10_16) || defined(__TVOS_14_0) || defined(__WATCHOS_7_0)
#define DTX_DIRECT_MEMBERS __attribute__((objc_direct_members))
#else
#define DTX_DIRECT_MEMBERS
#endif


#endif /* Swiftier_pch */
