//
//  DTXSingleUseSyncResource.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSingleEventSyncResource.h"
#import "DTXSyncManager-Private.h"
#import "_DTXObjectDeallocHelper.h"
#import "NSString+SyncResource.h"

@interface _DTXSingleUseDeallocationHelper : _DTXObjectDeallocHelper <DTXSingleEvent> @end
@implementation _DTXSingleUseDeallocationHelper

- (instancetype)initWithSyncResource:(__kindof DTXSyncResource *)syncResource
{
	self = [super initWithSyncResource:syncResource];
	
	if(self)
	{
		__weak typeof(self) weakSelf = self;
		self.performOnDealloc = ^{
			[weakSelf.syncResource endTracking];
		};
	}
	
	return self;
}

- (void)suspendTracking
{
	DTXSingleEventSyncResource* sr = self.syncResource;
	[sr suspendTracking];
}

- (void)resumeTracking
{
	DTXSingleEventSyncResource* sr = self.syncResource;
	[sr resumeTracking];
}

- (void)endTracking
{
	DTXSingleEventSyncResource* sr = self.syncResource;
	if(sr == nil)
	{
		return;
	}
	
	[sr endTracking];
	[DTXSyncManager unregisterSyncResource:sr];
	self.syncResource = nil;
}

@end

@implementation DTXSingleEventSyncResource
{
	NSString* _description;
	NSString* _object;
}

+ (id<DTXSingleEvent>)singleUseSyncResourceWithObjectDescription:(NSString*)object eventDescription:(NSString*)description
{
	DTXSingleEventSyncResource* rv = [[DTXSingleEventSyncResource alloc] init];
	rv->_description = description;
	rv->_object = object;
	[DTXSyncManager registerSyncResource:rv];
	[rv resumeTracking];
	
	_DTXSingleUseDeallocationHelper* helper = [[_DTXSingleUseDeallocationHelper alloc] initWithSyncResource:rv];
	
	return helper;
}

- (void)suspendTracking
{
	[self performUpdateBlock:^ NSUInteger {
		return 0;
	} eventIdentifier:_DTXStringReturningBlock([NSString stringWithFormat:@"%p", self]) eventDescription:_DTXStringReturningBlock(_description) objectDescription:_DTXStringReturningBlock([NSString stringWithFormat:@"%@", _object]) additionalDescription:nil];
}

- (void)resumeTracking
{
	[self performUpdateBlock:^ NSUInteger {
		return 1;
	} eventIdentifier:_DTXStringReturningBlock([NSString stringWithFormat:@"%p", self]) eventDescription:_DTXStringReturningBlock(_description) objectDescription:_DTXStringReturningBlock([NSString stringWithFormat:@"%@", _object]) additionalDescription:nil];
}

- (void)endTracking;
{
	[self suspendTracking];
	[DTXSyncManager unregisterSyncResource:self];
}

- (DTXBusyResource *)jsonDescription {
  return @{
    NSString.dtx_resourceNameKey: @"one_time_events",
    NSString.dtx_resourceDescriptionKey: @{
      @"event": _description ?: [NSNull null],
      @"object": _object ?: [NSNull null]
    }
  };
}

@end
