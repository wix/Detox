//
//  ActionRequestHandler.m
//  Extension
//
//  Created by Leo Natan (Wix) on 29/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "ActionRequestHandler.h"
#import <MobileCoreServices/MobileCoreServices.h>
#import "SetPermissionOperation.h"
#import "SetNotificationPermissionOperation.h"
#import "SetPhotosPermissionOperation.h"

@interface ActionRequestHandler ()
{
	NSOperationQueue* _operationQueue;
}

@end

@implementation ActionRequestHandler

- (NSArray<NSOperation*>*)_operationsForPermissionsAction:(NSDictionary*)permissionsAction bundleIdentifier:(NSString*)bundleIdentifier displayName:(NSString*)displayName
{
	NSDictionary<NSString*, Class>* classNameMapping = @{@"notifications": [SetNotificationPermissionOperation class],
														 @"photos": [SetPhotosPermissionOperation class]};
	
	NSMutableArray<NSOperation*>* rv = [NSMutableArray new];
	
	[permissionsAction.allKeys enumerateObjectsUsingBlock:^(NSString* _Nonnull key, NSUInteger idx, BOOL * _Nonnull stop) {
		SetPermissionOperation* operation = nil;
		
		Class cls = classNameMapping[key];
		if(cls == nil)
		{
			return;
		}
		
		operation = [cls new];
		operation.bundleIdentifier = bundleIdentifier;
		operation.displayName = displayName;
		operation.permissionStatus = permissionsAction[key];
		
		if(operation)
		{
			[rv addObject:operation];
		}
	}];
	
	return rv;
}

- (void)_handleExtensionRequest:(NSDictionary*)request completionHandler:(void(^)())handler
{
	_operationQueue = [NSOperationQueue new];
	_operationQueue.name = @"DetoxHelper Extension Queue";
	
	NSBlockOperation* cleanup = [NSBlockOperation blockOperationWithBlock:handler];
	
	NSString* bundleIdentifier = request[@"bundleIdentifier"];
	NSParameterAssert(bundleIdentifier != nil);
	
	[request.allKeys enumerateObjectsUsingBlock:^(NSString* _Nonnull key, NSUInteger idx, BOOL * _Nonnull stop) {
		if([key isEqualToString:@"setPermissions"])
		{
			NSArray<NSOperation*>* operations = [self _operationsForPermissionsAction:request[key] bundleIdentifier:bundleIdentifier displayName:bundleIdentifier];
			[operations enumerateObjectsUsingBlock:^(NSOperation * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
				[cleanup addDependency:obj];
			}];
			
			[_operationQueue addOperations:operations waitUntilFinished:NO];
		}
	}];
	
	[_operationQueue addOperation:cleanup];
}

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context
{
	NSParameterAssert(context.inputItems.count == 1);
	NSParameterAssert([context.inputItems.firstObject attachments].count == 1);
	
	[[context.inputItems.firstObject attachments].firstObject loadItemForTypeIdentifier:(id)kUTTypeItem options:nil completionHandler:^(id _Nullable item, NSError * _Null_unspecified error) {
		[self _handleExtensionRequest:item completionHandler:^() {
			[context completeRequestReturningItems:nil completionHandler:nil];
		}];
	}];
}

@end
