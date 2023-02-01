//
//  DTXSyncManager.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/28/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncManager-Private.h"
#import "DTXSyncResource.h"
#import "DTXOrigDispatch.h"
#import "DTXDispatchQueueSyncResource-Private.h"
#import "DTXRunLoopSyncResource-Private.h"
#import "DTXTimerSyncResource-Private.h"
#import "DTXSingleEventSyncResource.h"
#import "_DTXObjectDeallocHelper.h"
#import "CADisplayLink+DTXSpy-Private.h"
#import "NSString+SyncStatus.h"
#import "NSArray+Functional.h"

#include <dlfcn.h>

DTX_CREATE_LOG(SyncManager);
static BOOL _enableVerboseSystemLogging = NO;
BOOL __detox_sync_enableVerboseSyncResourceLogging = NO;
#define dtx_log_verbose_sync_system(format, ...) __extension__({ \
if(dtx_unlikely(_enableVerboseSystemLogging)) { __dtx_log(__prepare_and_return_file_log(), OS_LOG_TYPE_DEBUG, __current_log_prefix, format, ##__VA_ARGS__); } \
})

#define TRY_IDLE_BLOCKS() [self _tryIdleBlocksNow:_useDelayedFire == 0];

typedef void (^DTXIdleBlock)(void);

@interface _DTXIdleTupple : NSObject

@property (nonatomic, copy) DTXIdleBlock block;
@property (nonatomic, strong) dispatch_queue_t queue;

@end
@implementation _DTXIdleTupple @end

void __detox_sync_DTXSyncResourceVerboseLog(NSString* format, ...)
{
	va_list argumentList;
	va_start(argumentList, format);
	__dtx_logv(__prepare_and_return_file_log(), OS_LOG_TYPE_DEBUG, __current_log_prefix, format, argumentList);
	va_end(argumentList);
}

static dispatch_queue_t _queue;
static void* _queueSpecific = &_queueSpecific;
static double _useDelayedFire;
static dispatch_source_t _delayedFire;

static NSMapTable* _resourceMapping;
static NSMutableSet* _registeredResources;
static NSMutableArray<_DTXIdleTupple*>* _pendingIdleBlocks;
static NSMapTable<NSThread*, NSDictionary*>* _trackedThreads;
static BOOL _systemWasBusy = NO;

static __weak id<DTXSyncManagerDelegate> _delegate;
static BOOL _delegate_syncSystemDidBecomeIdle = NO;
static BOOL _delegate_syncSystemDidBecomeBusy = NO;
static BOOL _delegate_syncSystemDidStartTrackingEventWithDescription = NO;
static BOOL _delegate_syncSystemDidEndTrackingEventWithDescription = NO;

static atomic_nstimeinterval _maximumAllowedDelayedActionTrackingDuration = ATOMIC_VAR_INIT(__builtin_inf());
static atomic_nstimeinterval _maximumTimerIntervalTrackingDuration = ATOMIC_VAR_INIT(__builtin_inf());
static atomic_bool _synchronizationDisabled = ATOMIC_VAR_INIT(NO);
static atomic_voidptr _URLBlacklist = ATOMIC_VAR_INIT(NULL);
static atomic_bool _modifyAnimations = ATOMIC_VAR_INIT(YES);
static atomic_nstimeinterval _maximumAnimationDuration = ATOMIC_VAR_INIT(1.0);

@implementation DTXSyncManager

+ (BOOL)synchronizationDisabled
{
	return atomic_load(&_synchronizationDisabled);
}

+ (void)setSynchronizationDisabled:(BOOL)synchronizationDisabled
{
	atomic_store(&_synchronizationDisabled, synchronizationDisabled);
}

+ (NSTimeInterval)maximumAllowedDelayedActionTrackingDuration
{
	return atomic_load(&_maximumAllowedDelayedActionTrackingDuration);
}

+ (void)setMaximumAllowedDelayedActionTrackingDuration:(NSTimeInterval)maximumAllowedDelayedActionTrackingDuration
{
	atomic_store(&_maximumAllowedDelayedActionTrackingDuration, maximumAllowedDelayedActionTrackingDuration);
}

+ (NSTimeInterval)maximumTimerIntervalTrackingDuration
{
	return atomic_load(&_maximumTimerIntervalTrackingDuration);
}

+ (void)setMaximumTimerIntervalTrackingDuration:(NSTimeInterval)maximumTimerIntervalTrackingDuration
{
	atomic_store(&_maximumTimerIntervalTrackingDuration, maximumTimerIntervalTrackingDuration);
}

+ (NSArray<NSString *> *)URLBlacklist
{
	return NS(atomic_load(&_URLBlacklist));
}

+ (void)setURLBlacklist:(NSArray<NSString *> *)URLBlacklist
{
	void* old = atomic_load(&_URLBlacklist);
	if(old != NULL)
	{
		CFRelease(old);
	}
	atomic_store(&_URLBlacklist, (void*)CFBridgingRetain(URLBlacklist.copy));
}

+ (void)setModifyAnimations:(BOOL)modifyAnimations
{
	atomic_store(&_modifyAnimations, modifyAnimations);
}

+ (BOOL)modifyAnimations
{
	return atomic_load(&_modifyAnimations);
}

+ (void)setMaximumAnimationDuration:(NSTimeInterval)maximumAnimationDuration
{
	atomic_store(&_maximumAnimationDuration, maximumAnimationDuration);
}

+ (NSTimeInterval)maximumAnimationDuration
{
	return atomic_load(&_maximumAnimationDuration);
}

+ (id<DTXSyncManagerDelegate>)delegate
{
	return _delegate;
}

+ (void)setDelegate:(id<DTXSyncManagerDelegate>)delegate
{
	_delegate = delegate;
	
	_delegate_syncSystemDidBecomeIdle = [_delegate respondsToSelector:@selector(syncSystemDidBecomeIdle)];
	_delegate_syncSystemDidBecomeBusy = [_delegate respondsToSelector:@selector(syncSystemDidBecomeBusy)];
	_delegate_syncSystemDidStartTrackingEventWithDescription = [_delegate respondsToSelector:@selector(syncSystemDidStartTrackingEventWithIdentifier:description:objectDescription:additionalDescription:)];
	_delegate_syncSystemDidEndTrackingEventWithDescription = [_delegate respondsToSelector:@selector(syncSystemDidEndTrackingEventWithIdentifier:)];
	
	if(_delegate == nil)
	{
		return;
	}
	
	BOOL systemBusy = DTXIsSystemBusyNow();
	if(systemBusy && _delegate_syncSystemDidBecomeBusy)
	{
		[_delegate syncSystemDidBecomeBusy];
	}
	else if(!systemBusy && _delegate_syncSystemDidBecomeIdle)
	{
		[_delegate syncSystemDidBecomeIdle];
	}
}

+ (void)__superload
{
	@autoreleasepool
	{
		__detox_sync_enableVerboseSyncResourceLogging = [NSUserDefaults.standardUserDefaults boolForKey:@"DTXEnableVerboseSyncResources"];
		_enableVerboseSystemLogging = [NSUserDefaults.standardUserDefaults boolForKey:@"DTXEnableVerboseSyncSystem"];
		
		__detox_sync_orig_dispatch_sync = dlsym(RTLD_DEFAULT, "dispatch_sync");
		__detox_sync_orig_dispatch_async = dlsym(RTLD_DEFAULT, "dispatch_async");
		__detox_sync_orig_dispatch_after = dlsym(RTLD_DEFAULT, "dispatch_after");
		
		_queue = dtx_dispatch_queue_create_autoreleasing("com.wix.DTXSyncManager", DISPATCH_QUEUE_SERIAL);
		dispatch_queue_set_specific(_queue, _queueSpecific, _queueSpecific, NULL);
		NSString* DTXEnableDelayedIdleFire = [NSUserDefaults.standardUserDefaults stringForKey:@"DTXEnableDelayedIdleFire"];
		NSNumberFormatter* nf = [NSNumberFormatter new];
		NSNumber* value = [nf numberFromString:DTXEnableDelayedIdleFire];
		_useDelayedFire = [value doubleValue];
		
		_resourceMapping = NSMapTable.strongToStrongObjectsMapTable;
		_registeredResources = [NSMutableSet new];
		_pendingIdleBlocks = [NSMutableArray new];
		
		_trackedThreads = [NSMapTable weakToStrongObjectsMapTable];
		[_trackedThreads setObject:@{@"name": @"Main Thread"} forKey:[NSThread mainThread]];
		
		[self _trackCFRunLoop:CFRunLoopGetMain() name:@"Main RunLoop"];
		_systemWasBusy = DTXIsSystemBusyNow();
	}
}

+ (void)registerSyncResource:(DTXSyncResource*)syncResource
{
	__detox_sync_orig_dispatch_sync(_queue, ^ {
		[_registeredResources addObject:syncResource];
	});
}

+ (void)unregisterSyncResource:(DTXSyncResource*)syncResource
{
	__detox_sync_orig_dispatch_sync(_queue, ^ {
		[_registeredResources removeObject:syncResource];
		[_resourceMapping removeObjectForKey:syncResource];
		
		TRY_IDLE_BLOCKS();
	});
}

+ (void)performUpdateWithEventIdentifier:(NSString*(NS_NOESCAPE ^)(void))eventID
						eventDescription:(NSString*(NS_NOESCAPE ^)(void))eventDescription
					   objectDescription:(NSString*(NS_NOESCAPE ^)(void))objectDescription
				   additionalDescription:(nullable NSString*(NS_NOESCAPE ^)(void))additionalDescription
							syncResource:(DTXSyncResource*)resource
								   block:(NSUInteger(NS_NOESCAPE ^)(void))block
{
	dispatch_block_t outerBlock = ^ {
		if([_registeredResources containsObject:resource] == NO)
		{
			DTXSyncResourceVerboseLog(@"Provided resource %@ is not registered, ignoring.", resource);
			return;
		}
		
		NSUInteger previousBusyCount = [[_resourceMapping objectForKey:resource] unsignedIntegerValue];
		NSUInteger busyCount = block();
		if(previousBusyCount != busyCount)
		{
			DTXSyncResourceVerboseLog(@"%@", resource.jsonDescription);
			
			if(dtx_unlikely(_delegate != nil))
			{
				if(previousBusyCount < busyCount && dtx_unlikely(_delegate_syncSystemDidStartTrackingEventWithDescription))
				{
					NSString* identifier = eventID();
					[_delegate syncSystemDidStartTrackingEventWithIdentifier:identifier
																 description:eventDescription ? eventDescription() : nil
														   objectDescription:objectDescription ? objectDescription() : nil
													   additionalDescription:additionalDescription ? additionalDescription() : nil];
				}
				else if(previousBusyCount > busyCount && dtx_unlikely(_delegate_syncSystemDidEndTrackingEventWithDescription))
				{
					[_delegate syncSystemDidEndTrackingEventWithIdentifier:eventID()];
				}
			}
		}
		
		[_resourceMapping setObject:@(busyCount) forKey:resource];
		
		TRY_IDLE_BLOCKS();
	};
	
	if(dispatch_get_specific(_queueSpecific) == _queueSpecific)
	{
		outerBlock();
		return;
	}
	
	__detox_sync_orig_dispatch_sync(_queue, outerBlock);
}

+ (void)performMultipleUpdatesWithEventIdentifiers:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))eventIDs
								 eventDescriptions:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))_eventDescriptions
								objectDescriptions:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))_objectDescriptions
							additionalDescriptions:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))_additionalDescriptions
									  syncResource:(DTXSyncResource*)resource
											 block:(NSUInteger(NS_NOESCAPE ^)(void))block
{
	dispatch_block_t outerBlock = ^ {
		if([_registeredResources containsObject:resource] == NO)
		{
			DTXSyncResourceVerboseLog(@"Provided resource %@ is not registered, ignoring.", resource);
			return;
		}
		
		NSUInteger previousBusyCount = [[_resourceMapping objectForKey:resource] unsignedIntegerValue];
		NSUInteger busyCount = block();
		if(previousBusyCount != busyCount)
		{
        DTXSyncResourceVerboseLog(@"%@", resource.jsonDescription);
			
			if(dtx_unlikely(_delegate != nil))
			{
				if(previousBusyCount < busyCount && dtx_unlikely(_delegate_syncSystemDidStartTrackingEventWithDescription))
				{
					NSArray<NSString*(^)(void)>* identifiers = eventIDs();
					NSArray<NSString*(^)(void)>* eventDescriptions = _eventDescriptions ? _eventDescriptions() : nil;
					NSArray<NSString*(^)(void)>* objectDescriptions = _objectDescriptions ? _objectDescriptions() : nil;
					NSArray<NSString*(^)(void)>* additionalDescriptions = _additionalDescriptions ? _additionalDescriptions() : nil;
					
					[identifiers enumerateObjectsUsingBlock:^(NSString*(^_Nonnull identifierBlock)(void), NSUInteger idx, BOOL * _Nonnull stop) {
						NSString* identifier = identifierBlock();
						
						NSString* eventDescription = eventDescriptions.count > idx ? eventDescriptions[idx]() : nil;
						NSString* objectDescription = objectDescriptions.count > idx ? objectDescriptions[idx]() : nil;
						NSString* additionalDescription = additionalDescriptions.count > idx ? additionalDescriptions[idx]() : nil;
						
						[_delegate syncSystemDidStartTrackingEventWithIdentifier:identifier
																	 description:eventDescription
															   objectDescription:objectDescription
														   additionalDescription:additionalDescription];
					}];
				}
				else if(previousBusyCount > busyCount && dtx_unlikely(_delegate_syncSystemDidEndTrackingEventWithDescription))
				{
					NSArray<NSString*(^)(void)>* identifiers = eventIDs();
					
					for (NSString*(^identifier)(void) in identifiers) {
						[_delegate syncSystemDidEndTrackingEventWithIdentifier:identifier()];
					}
				}
			}
		}
		
		[_resourceMapping setObject:@(busyCount) forKey:resource];
		
		TRY_IDLE_BLOCKS();
	};
	
	if(dispatch_get_specific(_queueSpecific) == _queueSpecific)
	{
		outerBlock();
		return;
	}
	
	__detox_sync_orig_dispatch_sync(_queue, outerBlock);
}

+ (void)_fireDelayedTimer
{
	if(_delayedFire != nil)
	{
		dispatch_source_set_timer(_delayedFire, dispatch_time(DISPATCH_TIME_NOW, _useDelayedFire * NSEC_PER_SEC), 0, (1ull * NSEC_PER_SEC) / 10);
		return;
	}
	
	_delayedFire = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, _queue);
	dispatch_source_set_timer(_delayedFire, dispatch_time(DISPATCH_TIME_NOW, _useDelayedFire * NSEC_PER_SEC), 0, (1ull * NSEC_PER_SEC) / 10);
	dispatch_source_set_event_handler(_delayedFire, ^{
		[self _tryIdleBlocksNow:YES];
		dispatch_source_cancel(_delayedFire);
		_delayedFire = nil;
	});
	dispatch_resume(_delayedFire);
}

DTX_ALWAYS_INLINE
static BOOL DTXIsSystemBusyNow(void)
{
	BOOL systemBusy = NO;
	
	for(NSNumber* value in _resourceMapping.objectEnumerator)
	{
		systemBusy |= (value.unsignedIntegerValue > 0);
		
		if(systemBusy == YES)
		{
			break;
		}
	}
	
	return systemBusy;
}

+ (void)_tryIdleBlocksNow:(BOOL)now
{
	if(_pendingIdleBlocks.count == 0 && dtx_likely(_enableVerboseSystemLogging == NO) && dtx_likely(_delegate_syncSystemDidBecomeBusy == NO) && dtx_likely(_delegate_syncSystemDidBecomeIdle == NO))
	{
		return;
	}
	
	__block BOOL systemBusy = NO;
	dtx_defer {
		_systemWasBusy = systemBusy;
	};
	
	systemBusy = DTXIsSystemBusyNow();
	
	if(systemBusy == YES)
	{
		if(systemBusy != _systemWasBusy)
		{
			dtx_log_verbose_sync_system(@"🛑 Sync system is busy");
			if(dtx_unlikely(_delegate_syncSystemDidBecomeBusy))
			{
				[_delegate syncSystemDidBecomeBusy];
			}
		}
		return;
	}
	else
	{
		if(systemBusy != _systemWasBusy || now == YES)
		{
			BOOL isDelayed = now == NO && _pendingIdleBlocks.count > 0;
			dtx_log_verbose_sync_system(@"%@ Sync system idle%@", isDelayed ? @"↩️" : @"🏁" , isDelayed ? @" (delayed)" : @"");
			if(dtx_unlikely(_delegate_syncSystemDidBecomeIdle))
			{
				[_delegate syncSystemDidBecomeIdle];
			}
		}
	}
	
	if(_pendingIdleBlocks.count == 0)
	{
		return;
	}
	
	if(now == NO)
	{
		[self _fireDelayedTimer];
		return;
	}
	
	NSArray<_DTXIdleTupple*>* pendingWork = _pendingIdleBlocks.copy;
	[_pendingIdleBlocks removeAllObjects];
	
	NSMapTable<dispatch_queue_t, NSMutableArray<DTXIdleBlock>*>* blockDispatches = [NSMapTable strongToStrongObjectsMapTable];
	
	for (_DTXIdleTupple* obj in pendingWork) {
		if(obj.queue == nil)
		{
			obj.block();
			
			continue;
		}
		
		NSMutableArray<DTXIdleBlock>* arr = [blockDispatches objectForKey:obj.queue];
		if(arr == nil)
		{
			arr = [NSMutableArray new];
		}
		[arr addObject:obj.block];
		[blockDispatches setObject:arr forKey:obj.queue];
	}
	
	for(dispatch_queue_t queue in blockDispatches.keyEnumerator)
	{
		NSMutableArray<DTXIdleBlock>* arr = [blockDispatches objectForKey:queue];
		__detox_sync_orig_dispatch_async(queue, ^ {
			for(DTXIdleBlock block in arr)
			{
				block();
			}
		});
	}
}

+ (void)enqueueIdleBlock:(void(^)(void))block;
{
	[self enqueueIdleBlock:block queue:nil];
}

+ (void)enqueueMainQueueIdleBlock:(void(^)(void))block;
{
	[self enqueueIdleBlock:block queue:dispatch_get_main_queue()];
}

+ (void)enqueueIdleBlock:(void(^)(void))block queue:(dispatch_queue_t)queue;
{
	if(dtx_unlikely(DTXSyncManager.synchronizationDisabled))
	{
		if(queue == nil)
		{
			block();
			
			return;
		}
		
		__detox_sync_orig_dispatch_async(queue, block);
		
		return;
	}
	
	dispatch_block_t outerBlock = ^ {
		_DTXIdleTupple* t = [_DTXIdleTupple new];
		t.block = block;
		t.queue = queue;
		
		[_pendingIdleBlocks addObject:t];
		
		TRY_IDLE_BLOCKS()
	};
	
	if(dispatch_get_specific(_queueSpecific) == _queueSpecific)
	{
		__detox_sync_orig_dispatch_async(_queue, outerBlock);
		return;
	}
	
	__detox_sync_orig_dispatch_sync(_queue, outerBlock);
}

+ (void)trackDispatchQueue:(dispatch_queue_t)dispatchQueue name:(nullable NSString*)name
{
	if(dispatchQueue == dispatch_get_main_queue())
	{
		return;
	}
	
	DTXDispatchQueueSyncResource* sr = [DTXDispatchQueueSyncResource dispatchQueueSyncResourceWithQueue:dispatchQueue];
	sr.queueName = name;
	[self registerSyncResource:sr];
}

+ (void)untrackDispatchQueue:(dispatch_queue_t)dispatchQueue
{
	if(dispatchQueue == dispatch_get_main_queue())
	{
		return;
	}
	
	DTXDispatchQueueSyncResource* sr = [DTXDispatchQueueSyncResource _existingSyncResourceWithQueue:dispatchQueue cleanup:YES];
	if(sr)
	{
		[self unregisterSyncResource:sr];
	}
}

+ (void)trackRunLoop:(NSRunLoop *)runLoop name:(nullable NSString*)name
{
	[self trackCFRunLoop:runLoop.getCFRunLoop name:name];
}

+ (void)untrackRunLoop:(NSRunLoop *)runLoop
{
	[self untrackCFRunLoop:runLoop.getCFRunLoop];
}

+ (void)trackCFRunLoop:(CFRunLoopRef)runLoop name:(nullable NSString*)name
{
	if(runLoop == CFRunLoopGetMain())
	{
		return;
	}
	
	[self _trackCFRunLoop:runLoop name:name];
}

+ (void)_trackCFRunLoop:(CFRunLoopRef)runLoop name:(nullable NSString*)name
{
	DTXRunLoopSyncResource* sr = [DTXRunLoopSyncResource _existingSyncResourceWithRunLoop:runLoop clear:NO];
	if(sr != nil)
	{
		return;
	}
	
	sr = [DTXRunLoopSyncResource runLoopSyncResourceWithRunLoop:runLoop];
	sr.runLoopName = name;
	[self registerSyncResource:sr];
	[sr _startTracking];
}

+ (void)untrackCFRunLoop:(CFRunLoopRef)runLoop
{
	if(runLoop == CFRunLoopGetMain() || runLoop == NULL)
	{
		return;
	}
	
	[self _untrackCFRunLoop:runLoop];
	
	[DTXTimerSyncResource clearTimersForCFRunLoop:runLoop];
}

+ (void)_untrackCFRunLoop:(CFRunLoopRef)runLoop
{
	id sr = [DTXRunLoopSyncResource _existingSyncResourceWithRunLoop:runLoop clear:YES];
	if(sr == nil)
	{
		return;
	}
	
	[sr _stopTracking];
	[self unregisterSyncResource:sr];
}

+ (BOOL)isRunLoopTracked:(CFRunLoopRef)runLoop
{
	id sr = [DTXRunLoopSyncResource _existingSyncResourceWithRunLoop:runLoop clear:NO];
	return sr != nil;
}

+ (void)trackThread:(NSThread *)thread name:(nullable NSString*)name
{
	if([thread isMainThread])
	{
		return;
	}
	
	__detox_sync_orig_dispatch_sync(_queue, ^ {
		NSDictionary* dict = name ? @{@"name": name} : @{};
		[_trackedThreads setObject:dict forKey:thread];
	});
}

+ (void)untrackThread:(NSThread *)thread
{
	if([thread isMainThread])
	{
		return;
	}
	
	__detox_sync_orig_dispatch_sync(_queue, ^ {
		[_trackedThreads removeObjectForKey:thread];
	});
}

+ (BOOL)isThreadTracked:(NSThread*)thread
{
	if(thread.isMainThread == YES)
	{
		return YES;
	}

	__block BOOL rv = NO;
	__detox_sync_orig_dispatch_sync(_queue, ^ {
		rv = [_trackedThreads objectForKey:thread] != nil;
	});
	
	return rv;
}

+ (void)trackDisplayLink:(CADisplayLink *)displayLink name:(nullable NSString*)name
{
	id<DTXTimerProxy> proxy = [DTXTimerSyncResource existingTimerProxyWithDisplayLink:displayLink create:YES];
	proxy.name = name;
	[displayLink _detox_sync_trackIfNeeded];
}

+ (void)untrackDisplayLink:(CADisplayLink *)displayLink
{
	[DTXTimerSyncResource clearExistingTimerProxyWithDisplayLink:displayLink];
}

+ (id<DTXTrackedEvent>)trackEventWithDescription:(NSString*)description objectDescription:(NSString*)objectDescription
{
	return [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:objectDescription eventDescription:description];
}

+ (DTXSyncStatus *)_syncStatus {
  auto busyResourcesDescriptions = [self busyResourcesDescriptions];

  if (!busyResourcesDescriptions.count) {
    return @{ NSString.dtx_appStatusKey: @"idle" };
  }

  return @{
    NSString.dtx_appStatusKey: @"busy",
    NSString.dtx_busyResourcesKey: busyResourcesDescriptions
  };
}

+ (NSArray<NSDictionary *> *)busyResourcesDescriptions {
  return [[[_registeredResources allObjects]
      filter:^BOOL(DTXSyncResource* resource) {
        NSNumber *busyCount = [_resourceMapping objectForKey:resource];
        return busyCount.unsignedIntValue;
      }]
      map:^NSDictionary<NSString *,id> * (DTXSyncResource* resource) {
        return resource.jsonDescription;
      }];
}

+ (void)statusWithCompletionHandler:(DTXStatusHandler)completionHandler {
  __detox_sync_orig_dispatch_async(_queue, ^ {
    completionHandler([self _syncStatus]);
  });
}

@end
