//
//  NSURLSessionTask+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/4/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "NSURLSessionTask+DTXSpy.h"
#import "DTXSingleEventSyncResource.h"
#import "NSURL+DetoxSyncUtils.h"

@import ObjectiveC;

static const void* _DTXNetworkTaskSRKey = &_DTXNetworkTaskSRKey;

@interface NSURLSessionTask ()

- (void)resume;
- (void)connection:(id)arg1 didFinishLoadingWithError:(id)arg2;

@property (nonatomic, readonly, strong) NSURLSession* session;

@end

@implementation NSURLSessionTask (DTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		Class cls = NSClassFromString(@"__NSCFLocalDataTask");
		
		NSError* error;
		if([cls instancesRespondToSelector:NSSelectorFromString(@"greyswizzled_resume")])
		{
			DTXSwizzleMethod(cls, NSSelectorFromString(@"greyswizzled_resume"), @selector(__detox_sync_resume), &error);
		}
		else
		{
			DTXSwizzleMethod(cls, @selector(resume), @selector(__detox_sync_resume), &error);
		}
		DTXSwizzleMethod(cls, @selector(suspend), @selector(__detox_sync_suspend), &error);
		DTXSwizzleMethod(cls, NSSelectorFromString(@"connection:didFinishLoadingWithError:"), @selector(__detox_sync_connection:didFinishLoadingWithError:), &error);
	}
}

- (void)__detox_sync_resume
{
	id<DTXSingleEvent> sr = objc_getAssociatedObject(self, _DTXNetworkTaskSRKey);
	if(sr != nil)
	{
		[sr resumeTracking];
	}
	else
	{
		if([self.originalRequest.URL detox_sync_shouldTrack])
		{
			sr = [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:[NSString stringWithFormat:@"URL: “%@”", self.originalRequest.URL.absoluteString] eventDescription:@"Network Request"];
			objc_setAssociatedObject(self, _DTXNetworkTaskSRKey, sr, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
		}
	}
	
	[self __detox_sync_resume];
}

- (void)__detox_sync_suspend
{
	id<DTXSingleEvent> sr = objc_getAssociatedObject(self, _DTXNetworkTaskSRKey);
	if(sr != nil)
	{
		[sr suspendTracking];
	}
	
	[self __detox_sync_suspend];
}

- (void)__detox_sync_untrackTask
{
	id<DTXSingleEvent> sr = objc_getAssociatedObject(self, _DTXNetworkTaskSRKey);
	[sr endTracking];
	objc_setAssociatedObject(self, _DTXNetworkTaskSRKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)__detox_sync_connection:(id)arg1 didFinishLoadingWithError:(id)arg2;
{
	[self __detox_sync_connection:arg1 didFinishLoadingWithError:arg2];
	
	if(self.session.delegate == nil)
	{
		[self __detox_sync_untrackTask];
	}
}

@end
