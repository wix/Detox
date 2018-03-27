//
//  WXAnimatedDisplayLinkIdlingResource.m
//  Detox
//
//  Created by Sergey Ilyevsky on 22/05/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "WXAnimatedDisplayLinkIdlingResource.h"

@implementation WXAnimatedDisplayLinkIdlingResource {
}

static NSString * const _RCTNativeAnimatedModuleClass = @"RCTNativeAnimatedModule";
static NSString * const _nodesManagerDisplayLinkPath = @"_nodesManager._displayLink";

+ (BOOL)isAvailable
{
	@try
	{
		Class animatedModuleClass = NSClassFromString(_RCTNativeAnimatedModuleClass);
		id animatedModule = [[animatedModuleClass alloc] init];
		
		if(!animatedModule) return NO;
		[animatedModule valueForKeyPath:_nodesManagerDisplayLinkPath];
		return YES;
	} @catch(id ex)
	{
		return NO;
	}
}

- (NSString *)idlingResourceName
{
	return NSStringFromClass([self class]);
}

- (NSString *)idlingResourceDescription
{
	return @"Monitors CADisplayLink objects created by React Native Animated";
}

- (BOOL)isIdleNow
{
	id bridgeClass = NSClassFromString(@"RCTBridge");
	SEL currentBridgeSelector = NSSelectorFromString(@"currentBridge");
	if([bridgeClass respondsToSelector:currentBridgeSelector] == NO)
	{
		return YES;
	}
	
	id (*currentBridgeFunction)(id, SEL) = (id (*)(id, SEL))[bridgeClass methodForSelector:currentBridgeSelector];
	id bridge = currentBridgeFunction(bridgeClass, currentBridgeSelector);
	
	Class animatedModuleClass = NSClassFromString(_RCTNativeAnimatedModuleClass);
	
	SEL moduleForClassSelector = NSSelectorFromString(@"moduleForClass:");
	if([bridge respondsToSelector:moduleForClassSelector] == NO)
	{
		return YES;
	}
	
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
	id animatedModule = [bridge performSelector:moduleForClassSelector withObject:animatedModuleClass];
#pragma clang diagnostic pop
	id displayLink = [animatedModule valueForKeyPath:_nodesManagerDisplayLinkPath];
	return displayLink == nil;
}

@end
