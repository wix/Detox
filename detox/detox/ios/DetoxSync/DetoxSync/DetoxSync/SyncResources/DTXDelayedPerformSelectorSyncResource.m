//
//  DTXDelayedPerformSelectorSyncResource.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/29/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXDelayedPerformSelectorSyncResource.h"
#import "DTXSyncManager-Private.h"
#import "NSString+SyncResource.h"

@interface DTXDelayedPerformSelectorSyncResource ()

@property (class, nonatomic, strong, readonly) DTXDelayedPerformSelectorSyncResource* sharedInstance;

- (nullable NSString*)trackPerformSelectorWithTarget:(id)target selector:(SEL)selector object:(id)obj;
- (void)untrackPerfromSelectorWithIdentifier:(NSString*)identifier;

@end

@interface DTXDelayedPerformSelectorProxy : NSObject <DTXDelayedPerformSelectorProxy> @end

@implementation DTXDelayedPerformSelectorProxy
{
	id _target;
	id _obj;
	SEL _selector;
	NSString* _identifier;
}

- (instancetype)initWithTarget:(id)target selector:(SEL)selector object:(id)obj identifier:(NSString*)identifier
{
	self = [super init];
	
	if(self)
	{
		_target = target;
		_obj = obj;
		_selector = selector;
		_identifier = identifier;
	}
	
	return self;
}

- (void)fire
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
	[_target performSelector:_selector withObject:_obj];
#pragma clang diagnostic pop
	
	[DTXDelayedPerformSelectorSyncResource.sharedInstance untrackPerfromSelectorWithIdentifier:_identifier];
	
	_target = nil;
	_obj = nil;
	_selector = nil;
}

@end

@implementation DTXDelayedPerformSelectorSyncResource
{
	NSUInteger _busyCount;
}

+ (DTXDelayedPerformSelectorSyncResource *)sharedInstance
{
	static DTXDelayedPerformSelectorSyncResource* shared;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		shared = [DTXDelayedPerformSelectorSyncResource new];
		[DTXSyncManager registerSyncResource:shared];
	});
	
	return shared;
}

- (NSString *)trackPerformSelectorWithTarget:(id)target selector:(SEL)selector object:(id)obj
{
	__block NSString* identifier = nil;
	
	[self
     performUpdateBlock:^NSUInteger{
      _busyCount++;
      return _busyCount;
    }
     eventIdentifier:^ {
      identifier = NSUUID.UUID.UUIDString;
      return identifier;
    }
     eventDescription:_DTXStringReturningBlock(self.resourceName)
     objectDescription:_DTXStringReturningBlock([NSString stringWithFormat:@"“%@” on “<%@: %p>”",
                                                 NSStringFromSelector(selector),
                                                 [target class], target])
     additionalDescription:nil];
	
	return identifier;
}

- (void)untrackPerfromSelectorWithIdentifier:(NSString *)identifier
{
	[self performUpdateBlock:^NSUInteger{
		_busyCount--;
		return _busyCount;
	} eventIdentifier:_DTXStringReturningBlock(identifier) eventDescription:nil objectDescription:nil additionalDescription:nil];
}

- (DTXBusyResource *)jsonDescription {
  return @{
    NSString.dtx_resourceNameKey: @"delayed_perform_selector",
    NSString.dtx_resourceDescriptionKey: @{
      @"pending_selectors": @(_busyCount)
    }
  };
}

+ (id<DTXDelayedPerformSelectorProxy>)delayedPerformSelectorProxyWithTarget:(id)target selector:(SEL)selector object:(id)obj;
{
	NSString* identifier = [DTXDelayedPerformSelectorSyncResource.sharedInstance trackPerformSelectorWithTarget:target selector:selector object:obj];
	
	return [[DTXDelayedPerformSelectorProxy alloc] initWithTarget:target selector:selector object:obj identifier:identifier];
}

@end
