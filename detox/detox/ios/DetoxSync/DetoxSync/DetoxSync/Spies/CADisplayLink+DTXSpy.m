//
//  CADisplayLink+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/14/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "CADisplayLink+DTXSpy-Private.h"
#import "DTXTimerSyncResource.h"
#import "DTXSyncManager-Private.h"
#import <execinfo.h>
#include <dlfcn.h>

@import Darwin;
@import ObjectiveC;

static const void* _DTXDisplayLinkRunLoopKey = &_DTXDisplayLinkRunLoopKey;
pthread_mutex_t runLoopMappingMutex;

@interface CADisplayLink ()

+ (instancetype)displayLinkWithDisplay:(id)arg1 target:(id)arg2 selector:(SEL)arg3;

@end

@implementation CADisplayLink (DTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		pthread_mutex_init(&runLoopMappingMutex, NULL);
		
		NSError* error;
		
		DTXSwizzleClassMethod(self, @selector(displayLinkWithDisplay:target:selector:), @selector(__detox_sync_displayLinkWithDisplay:target:selector:), &error);
		
		DTXSwizzleMethod(self, @selector(addToRunLoop:forMode:), @selector(__detox_sync_addToRunLoop:forMode:), &error);
		DTXSwizzleMethod(self, @selector(removeFromRunLoop:forMode:), @selector(__detox_sync_removeFromRunLoop:forMode:), &error);
		DTXSwizzleMethod(self, @selector(invalidate), @selector(__detox_sync_invalidate), &error);
		DTXSwizzleMethod(self, @selector(setPaused:), @selector(__detox_sync_setPaused:), &error);
	}
}

- (NSMutableSet<NSString*>*)__detox_sync_runLoopMapping
{
	NSMutableSet<NSString*>* rv = objc_getAssociatedObject(self, _DTXDisplayLinkRunLoopKey);
	if(rv == nil)
	{
		rv = [NSMutableSet new];
		objc_setAssociatedObject(self, _DTXDisplayLinkRunLoopKey, rv, OBJC_ASSOCIATION_RETAIN);
	}
	
	return rv;
}

+ (id)__detox_sync_displayLinkWithDisplay:(id)arg1 target:(id)arg2 selector:(SEL)arg3;
{
	return [self __detox_sync_displayLinkWithDisplay:arg1 target:arg2 selector:arg3];
}

extern atomic_cfrunloop __RNRunLoop;

- (void)__detox_sync_addToRunLoop:(NSRunLoop *)runLoop forMode:(NSRunLoopMode)mode
{
	CFRunLoopRef cfRunLoop = runLoop.getCFRunLoop;
	
	if([DTXSyncManager isRunLoopTracked:cfRunLoop])
	{
		NSString* str = [NSString stringWithFormat:@"%p_%@", runLoop.getCFRunLoop, mode];
		pthread_mutex_lock(&runLoopMappingMutex);
		[self.__detox_sync_runLoopMapping addObject:str];
		pthread_mutex_unlock(&runLoopMappingMutex);
		
		id<DTXTimerProxy> proxy = [DTXTimerSyncResource existingTimerProxyWithDisplayLink:self create:NO];
		if(self.isPaused == NO)
		{
			[proxy track];
		}
	}
	
	[self __detox_sync_addToRunLoop:runLoop forMode:mode];
}

- (void)_detox_sync_trackIfNeeded
{
	id<DTXTimerProxy> proxy = [DTXTimerSyncResource existingTimerProxyWithDisplayLink:self create:NO];
	
	pthread_mutex_lock(&runLoopMappingMutex);
	NSUInteger count = self.__detox_sync_runLoopMapping.count;
	pthread_mutex_unlock(&runLoopMappingMutex);
	
	if(count > 0)
	{
		[proxy track];
	}
}

- (void)__detox_sync_setPaused:(BOOL)paused
{
	if(self.isPaused != paused)
	{
		id<DTXTimerProxy> proxy = [DTXTimerSyncResource existingTimerProxyWithDisplayLink:self create:NO];
		if(paused == YES)
		{
			[proxy untrack];
		}
		else
		{
			[self _detox_sync_trackIfNeeded];
		}
	}
	
	[self __detox_sync_setPaused:paused];
}

- (void)__detox_sync_removeFromRunLoop:(NSRunLoop *)runloop forMode:(NSRunLoopMode)mode
{
	[self __detox_sync_removeFromRunLoop:runloop forMode:mode];
	
	id<DTXTimerProxy> proxy = [DTXTimerSyncResource existingTimerProxyWithDisplayLink:self create:NO];
	if(proxy)
	{
		NSString* str = [NSString stringWithFormat:@"%p_%@", runloop.getCFRunLoop, mode];
		pthread_mutex_lock(&runLoopMappingMutex);
		BOOL isContained = [self.__detox_sync_runLoopMapping containsObject:str];
		if(isContained == YES)
		{
			[self.__detox_sync_runLoopMapping removeObject:str];
		}
		NSUInteger count = self.__detox_sync_runLoopMapping.count;
		pthread_mutex_unlock(&runLoopMappingMutex);
		
		if(isContained == YES && count == 0)
		{
			[proxy untrack];
		}
	}
}

- (void)__detox_sync_invalidate
{
	id<DTXTimerProxy> proxy = [DTXTimerSyncResource existingTimerProxyWithDisplayLink:self create:NO];
	[proxy untrack];
	[DTXTimerSyncResource clearExistingTimerProxyWithDisplayLink:self];
	
	[self __detox_sync_invalidate];
}

@end
