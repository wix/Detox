//
//  NSURLConnection+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 12/4/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "NSURLConnection+DTXSpy.h"
#import "DTXSingleEventSyncResource.h"
@import ObjectiveC;

static void* __DTXConnectionUnique = &__DTXConnectionUnique;

@interface __detox_sync_URLConnectionDelegateProxy : NSObject <NSURLConnectionDataDelegate> @end

@implementation __detox_sync_URLConnectionDelegateProxy

- (nullable NSURLRequest *)connection:(NSURLConnection *)connection willSendRequest:(NSURLRequest *)request redirectResponse:(nullable NSURLResponse *)response
{
	if(objc_getAssociatedObject(self, __DTXConnectionUnique) == nil)
	{
		DTXSingleEventSyncResource* sr = [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:[NSString stringWithFormat:@"URL: “%@”", request.URL.absoluteString] eventDescription:@"Network Request"];
		
		objc_setAssociatedObject(self, __DTXConnectionUnique, sr, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	}
	
	NSURLRequest* rv = request;
	Class superclass = DTXDynamicSubclassSuper(self, __detox_sync_URLConnectionDelegateProxy.class);
	SEL cmd = @selector(connection:willSendRequest:redirectResponse:);
	if([superclass instancesRespondToSelector:cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = superclass};
		NSURLRequest* (*super_class)(struct objc_super*, SEL, id, id, id) = (void*)objc_msgSendSuper;
		rv = super_class(&super, cmd, connection, request, response);
	}
	return rv;
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error
{
	[objc_getAssociatedObject(self, __DTXConnectionUnique) endTracking];
	objc_setAssociatedObject(self, __DTXConnectionUnique, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	
	Class superclass = DTXDynamicSubclassSuper(self, __detox_sync_URLConnectionDelegateProxy.class);
	SEL cmd = @selector(connection:didFailWithError:);
	if([superclass instancesRespondToSelector:cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = superclass};
		void (*super_class)(struct objc_super*, SEL, id, id) = (void*)objc_msgSendSuper;
		super_class(&super, cmd, connection, error);
	}
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{
	[objc_getAssociatedObject(self, __DTXConnectionUnique) endTracking];
	objc_setAssociatedObject(self, __DTXConnectionUnique, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	
	Class superclass = DTXDynamicSubclassSuper(self, __detox_sync_URLConnectionDelegateProxy.class);
	SEL cmd = @selector(connectionDidFinishLoading:);
	if([superclass instancesRespondToSelector:cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = superclass};
		void (*super_class)(struct objc_super*, SEL, id) = (void*)objc_msgSendSuper;
		super_class(&super, cmd, connection);
	}
}

@end

@interface NSURLConnection ()

- (id)_initWithRequest:(id)arg1 delegate:(id)arg2 usesCache:(_Bool)arg3 maxContentLength:(long long)arg4 startImmediately:(_Bool)arg5 connectionProperties:(id)arg6;

@end

@implementation NSURLConnection (DTXSpy)

+ (void)load
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		NSError* error;
		DTXSwizzleMethod(self, @selector(_initWithRequest:delegate:usesCache:maxContentLength:startImmediately:connectionProperties:), @selector(_initWithRequest___detox_sync:delegate:usesCache:maxContentLength:startImmediately:connectionProperties:), &error);
	});
}

- (id)_initWithRequest___detox_sync:(NSURLRequest*)arg1 delegate:(id<NSURLConnectionDelegate>)origDelegate usesCache:(BOOL)arg3 maxContentLength:(long long)arg4 startImmediately:(BOOL)arg5 connectionProperties:(id)arg6
{
	if(origDelegate != nil)
	{
		DTXDynamicallySubclass(origDelegate, __detox_sync_URLConnectionDelegateProxy.class);
	}
	
	if(origDelegate == nil)
	{
		origDelegate = [__detox_sync_URLConnectionDelegateProxy new];
	}
	
	return [self _initWithRequest___detox_sync:arg1 delegate:origDelegate usesCache:arg3 maxContentLength:arg4 startImmediately:arg5 connectionProperties:arg6];
}

@end
