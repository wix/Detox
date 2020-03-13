//
//  __DTXDeallocSafeProxy.m
//  Detox
//
//  Created by Leo Natan (Wix) on 3/9/20.
//  Copyright © 2020 Wix. All rights reserved.
//

/***
*    ██╗    ██╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗
*    ██║    ██║██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝
*    ██║ █╗ ██║███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
*    ██║███╗██║██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║
*    ╚███╔███╔╝██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝
*     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝
*
*
* WARNING: This file compiles with ARC disabled! Take extra care when modifying or adding functionality.
*/

#import "__DTXDeallocSafeProxy.h"
@import ObjectiveC;

id objc_initWeakOrNil(id *location, id newObj);

@implementation __DTXDeallocSafeProxy
{
	NSString* _cachedDescription;
	NSString* _cachedDebugDescription;
	
	NSURLRequest* _cachedOriginalRequest;
	
	id _object;
}

@dynamic object, originalRequest;

- (NSString *)description
{
	id object = self.object;
	
	return  object ? [object description] : _cachedDescription ?: @"<UNKNOWN OBJECT>";
}

- (NSString *)debugDescription
{
	id object = self.object;
	
	return  object ? [object debugDescription] : _cachedDebugDescription ?: @"<UNKNOWN OBJECT>";
}

- (NSURLRequest *)originalRequest
{
	id object = self.object;
	
	if(object == nil)
	{
		return _cachedOriginalRequest;
	}
	
	return [object respondsToSelector:@selector(originalRequest)] ? [object originalRequest] : nil;
}

- (id)object
{
	return objc_loadWeak(&_object);
}

- (void)dealloc
{
	objc_storeWeak(&_object, nil);
	
	[_cachedDescription release];
	_cachedDescription = nil;
	[_cachedDebugDescription release];
	_cachedDebugDescription = nil;
	
	[super dealloc];
}

- (instancetype)initWithObject:(id)object
{
	self = [super init];
	if(self)
	{
		objc_initWeakOrNil(&_object, object);
		
		_cachedDescription = [[NSString alloc] initWithFormat:@"CACHED: %@", [self.object description]];
		if([self.object respondsToSelector:@selector(debugDescription)])
		{
			_cachedDebugDescription = [[NSString alloc] initWithFormat:@"CACHED: %@", [self.object debugDescription]];
		}
		else
		{
			_cachedDebugDescription = nil;
		}
		
		if([self.object isKindOfClass:NSURLSessionTask.class])
		{
			_cachedOriginalRequest = [[(NSURLSessionTask*)self.object originalRequest] copy];
		}
		else
		{
			_cachedOriginalRequest = nil;
		}
	}
	return self;
}

@end
