//
//  DTXSyncManager.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/28/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncManager.h"
@class DTXSyncResource;

#define _DTXStringReturningBlock(...) ^ { return __VA_ARGS__; }

NS_ASSUME_NONNULL_BEGIN

__attribute__((visibility("hidden")))
extern BOOL __detox_sync_enableVerboseSyncResourceLogging;
__attribute__((visibility("hidden")))
void __detox_sync_DTXSyncResourceVerboseLog(NSString* format, ...)  NS_FORMAT_FUNCTION(1,2);
#define DTXSyncResourceVerboseLog(...) __extension__({ if(dtx_unlikely(__detox_sync_enableVerboseSyncResourceLogging == YES)) { __detox_sync_DTXSyncResourceVerboseLog(__VA_ARGS__); } })

@interface DTXSyncManager ()

+ (void)registerSyncResource:(DTXSyncResource*)syncResource;
+ (void)unregisterSyncResource:(DTXSyncResource*)syncResource;

+ (void)performUpdateWithEventIdentifier:(NSString*(NS_NOESCAPE ^)(void))eventID
						eventDescription:(NSString*(NS_NOESCAPE ^)(void))eventDescription
					   objectDescription:(NSString*(NS_NOESCAPE ^)(void))objectDescription
				   additionalDescription:(nullable NSString*(NS_NOESCAPE ^)(void))additionalDescription
							syncResource:(DTXSyncResource*)resource
								   block:(NSUInteger(NS_NOESCAPE ^)(void))block;

+ (void)performMultipleUpdatesWithEventIdentifiers:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))eventIDs
								 eventDescriptions:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))_eventDescriptions
								objectDescriptions:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))_objectDescriptions
							additionalDescriptions:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))_additionalDescriptions
									  syncResource:(DTXSyncResource*)resource
											 block:(NSUInteger(NS_NOESCAPE ^)(void))block;

+ (BOOL)isThreadTracked:(NSThread*)thread;
+ (BOOL)isRunLoopTracked:(CFRunLoopRef)runLoop;

@end

NS_ASSUME_NONNULL_END
