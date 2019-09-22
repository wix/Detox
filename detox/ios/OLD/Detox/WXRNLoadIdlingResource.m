//
//  WXRNLoadIdlingResource.m
//  Detox
//
//  Created by Leo Natan (Wix) on 8/2/18.
//  Copyright © 2018 Wix. All rights reserved.
//

#import "WXRNLoadIdlingResource.h"
#import <stdatomic.h>
#import "ReactNativeSupport.h"
@import ObjectiveC;

static atomic_uintmax_t __numberOfLoadingRN = 0;

@interface RCTSource : NSObject @end

typedef void (^RCTSourceLoadBlock)(NSError *error, RCTSource *source);

static void (*__orig_loadBundleAtURL_onProgress_onComplete)(id self, SEL _cmd, NSURL* url, id onProgress, RCTSourceLoadBlock onComplete);
static void __dtx_loadBundleAtURL_onProgress_onComplete(id self, SEL _cmd, NSURL* url, id onProgress, RCTSourceLoadBlock onComplete)
{
	atomic_fetch_add(&__numberOfLoadingRN, 1);
	__orig_loadBundleAtURL_onProgress_onComplete(self, _cmd, url, onProgress, onComplete);
	
	[ReactNativeSupport waitForReactNativeLoadWithCompletionHandler:^{
		atomic_fetch_sub(&__numberOfLoadingRN, 1);
	}];
}

@implementation WXRNLoadIdlingResource

+ (void)load
{
	Class cls = NSClassFromString(@"RCTJavaScriptLoader");
	if(cls == nil)
	{
		return;
	}
	
	Method m = class_getClassMethod(cls, NSSelectorFromString(@"loadBundleAtURL:onProgress:onComplete:"));
	if(m == NULL)
	{
		return;
	}
	
	atomic_store(&__numberOfLoadingRN, 0);
	
	__orig_loadBundleAtURL_onProgress_onComplete = (void*)method_getImplementation(m);
	method_setImplementation(m, (void*)__dtx_loadBundleAtURL_onProgress_onComplete);
}

- (NSString *)idlingResourceDescription
{
	uint64_t localNumberOfLoadingRN = atomic_load(&__numberOfLoadingRN);
	
	return [NSString stringWithFormat:@"React Native is loading JavaScript (%@ pending loads)", @(localNumberOfLoadingRN)];
}

- (NSString *)idlingResourceName
{
	return @"WXRNLoadIdlingResource";
}

- (BOOL)isIdleNow
{
	uint64_t localNumberOfLoadingRN = atomic_load(&__numberOfLoadingRN);
	
	return localNumberOfLoadingRN == 0;
}

@end
