//
//  NSURLSession+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/4/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "NSURLSession+DTXSpy.h"
#import "NSURLSessionTask+DTXSpy.h"
@import ObjectiveC;

@interface __detox_sync_URLSessionDelegateProxy : NSObject <NSURLSessionDataDelegate> @end

@implementation __detox_sync_URLSessionDelegateProxy

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveResponse:(NSURLResponse *)response completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))completionHandler
{
	Class superclass = DTXDynamicSubclassSuper(self, __detox_sync_URLSessionDelegateProxy.class);
	SEL cmd = @selector(URLSession:dataTask:didReceiveResponse:completionHandler:);
	if([superclass instancesRespondToSelector:cmd])
	{
		id detoxSyncCompletionHandler = ^(NSURLSessionResponseDisposition disposition) {
			completionHandler(disposition);
			
			//If the task is "upgraded" to a different type, stop tracking it.
			switch (disposition) {
				case NSURLSessionResponseBecomeDownload:
				case NSURLSessionResponseBecomeStream:
					[dataTask __detox_sync_untrackTask];
					break;
				default:
					break;
			}
		};
		
		struct objc_super super = {.receiver = self, .super_class = superclass};
		void (*super_class)(struct objc_super*, SEL, id, id, id, id) = (void*)objc_msgSendSuper;
		super_class(&super, cmd, session, dataTask, response, detoxSyncCompletionHandler);
	}
	else
	{
		completionHandler(NSURLSessionResponseAllow);
	}
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(nullable NSError *)error
{
	Class superclass = DTXDynamicSubclassSuper(self, __detox_sync_URLSessionDelegateProxy.class);
	SEL cmd = @selector(URLSession:task:didCompleteWithError:);
	if([superclass instancesRespondToSelector:cmd])
	{
		struct objc_super super = {.receiver = self, .super_class = superclass};
		void (*super_class)(struct objc_super*, SEL, id, id, id) = (void*)objc_msgSendSuper;
		super_class(&super, cmd, session, task, error);
	}
	
	[task __detox_sync_untrackTask];
}

@end

@import ObjectiveC;

@implementation NSURLSession (DTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		NSError* error;
		
		Class cls = NSClassFromString(@"__NSURLSessionLocal");
		DTXSwizzleClassMethod(NSURLSession.class, @selector(sessionWithConfiguration:delegate:delegateQueue:), @selector(__detox_sync_sessionWithConfiguration:delegate:delegateQueue:), &error);
		
//		DTXSwizzleMethod(cls, @selector(dataTaskWithRequest:), @selector(__detox_sync_dataTaskWithRequest:), &error);
//		DTXSwizzleMethod(cls, @selector(dataTaskWithURL:), @selector(__detox_sync_dataTaskWithURL:), &error);
		DTXSwizzleMethod(cls, @selector(dataTaskWithRequest:completionHandler:), @selector(__detox_sync_dataTaskWithRequest:completionHandler:), &error);
		DTXSwizzleMethod(cls, @selector(dataTaskWithURL:completionHandler:), @selector(__detox_sync_dataTaskWithURL:completionHandler:), &error);
	}
}

+ (NSURLSession *)__detox_sync_sessionWithConfiguration:(NSURLSessionConfiguration *)configuration delegate:(id<NSURLSessionDelegate>)delegate delegateQueue:(NSOperationQueue *)queue
{
	if(delegate != nil)
	{
		DTXDynamicallySubclass(delegate, __detox_sync_URLSessionDelegateProxy.class);
	}
	
	return [self __detox_sync_sessionWithConfiguration:configuration delegate:delegate delegateQueue:queue];
}

//- (NSURLSessionDataTask *)__detox_sync_dataTaskWithRequest:(NSURLRequest *)request
//{
//	if(self.delegate != nil)
//	{
////		DTXDynamicallySubclass(self.delegate, __detox_sync_URLSessionDelegateProxy.class);
//	}
//	id rv = [self __detox_sync_dataTaskWithRequest:request];
//
//	return rv;
//}
//
//- (NSURLSessionDataTask *)__detox_sync_dataTaskWithURL:(NSURL *)url;
//{
//	if(self.delegate != nil)
//	{
//		DTXDynamicallySubclass(self.delegate, __detox_sync_URLSessionDelegateProxy.class);
//		DTXDynamicallySubclass(self.delegate, __detox_sync_URLSessionDelegateProxy2.class);
//	}
//	id rv = [self __detox_sync_dataTaskWithURL:url];
//
//	return rv;
//}

- (NSURLSessionDataTask *)__detox_sync_dataTaskWithRequest:(NSURLRequest *)request completionHandler:(void (^)(NSData * _Nullable, NSURLResponse * _Nullable, NSError * _Nullable))completionHandler
{
	__block NSURLSessionDataTask* rv;
	
	id syncCompletionHandler = completionHandler == nil ? nil : ^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
		completionHandler(data, response, error);
		
		[rv __detox_sync_untrackTask];
	};
	
	rv = [self __detox_sync_dataTaskWithRequest:request completionHandler:syncCompletionHandler];
	
	return rv;
}

- (NSURLSessionDataTask *)__detox_sync_dataTaskWithURL:(NSURL *)url completionHandler:(void (^)(NSData * _Nullable, NSURLResponse * _Nullable, NSError * _Nullable))completionHandler
{
	__block NSURLSessionDataTask* rv;
	
	id syncCompletionHandler = completionHandler == nil ? nil : ^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
		completionHandler(data, response, error);
		
		[rv __detox_sync_untrackTask];
	};
	
	rv = [self __detox_sync_dataTaskWithURL:url completionHandler:syncCompletionHandler];
	
	return rv;
}

@end
