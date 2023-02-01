//
//  DTXSyncResource.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/28/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncResource-Private.h"
#import "DTXSyncManager-Private.h"
#import "DTXAddressInfo.h"
#import <execinfo.h>
#import "NSString+SyncResource.h"

#if DEBUG
#define MAX_FRAME_COUNT 50
#endif

@import ObjectiveC;

@implementation DTXSyncResource
{
#if DEBUG
	void** _symbols;
	int _symbolCount;
	
	NSString* _historyString;
#endif
}

#if DEBUG
- (instancetype)init
{
	self = [super init];
	
	if(self)
	{
		_symbols = malloc(MAX_FRAME_COUNT * sizeof(void*));
		_symbolCount = backtrace(_symbols, MAX_FRAME_COUNT);
	}
	
	return self;
}
#endif

#if DEBUG
- (NSString*)history
{
	if(_historyString)
	{
		return _historyString;
	}
	
	//Symbolicate
	NSMutableString* str = [NSMutableString new];
	for (int idx = 0; idx < _symbolCount; idx++) {
		DTXAddressInfo* addrInfo = [[DTXAddressInfo alloc] initWithAddress:(NSUInteger)_symbols[idx]];
		[str appendFormat:@"%@\n", [addrInfo formattedDescriptionForIndex:idx]];
	}
	
	_historyString = str;
	
	_symbolCount = 0;
	free(_symbols);
	_symbols = NULL;
	
	return _historyString;
}
#endif

- (void)performUpdateBlock:(NSUInteger(NS_NOESCAPE ^)(void))block
		   eventIdentifier:(NSString*(NS_NOESCAPE ^)(void))eventID
		  eventDescription:(nullable NSString*(NS_NOESCAPE ^)(void))eventDescription
		 objectDescription:(nullable NSString*(NS_NOESCAPE ^)(void))objectDescription
	 additionalDescription:(nullable NSString*(NS_NOESCAPE ^)(void))additionalDescription
{
	[DTXSyncManager performUpdateWithEventIdentifier:eventID
									eventDescription:eventDescription
								   objectDescription:objectDescription
							   additionalDescription:additionalDescription
										syncResource:self
											   block:block];
}

- (void)performMultipleUpdateBlock:(NSUInteger(NS_NOESCAPE ^)(void))block
				  eventIdentifiers:(NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))eventIDs
				 eventDescriptions:(nullable NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))eventDescriptions
				objectDescriptions:(nullable NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))objectDescriptions
			additionalDescriptions:(nullable NSArray<NSString*(^)(void)>*(NS_NOESCAPE ^)(void))additionalDescriptions
{
	[DTXSyncManager performMultipleUpdatesWithEventIdentifiers:eventIDs
											 eventDescriptions:eventDescriptions
											objectDescriptions:objectDescriptions
										additionalDescriptions:additionalDescriptions
												  syncResource:self
														 block:block];
}

- (DTXBusyResource *)jsonDescription {
  [self doesNotRecognizeSelector:_cmd];
  return nil;
}

- (NSString *)resourceName {
  return [self jsonDescription][NSString.dtx_resourceNameKey];
}

- (void)dealloc
{
	[DTXSyncManager unregisterSyncResource:self];
	
#if DEBUG
	if(_symbols != NULL)
	{
		free(_symbols);
		_symbols = NULL;
	}
#endif
}

@end
