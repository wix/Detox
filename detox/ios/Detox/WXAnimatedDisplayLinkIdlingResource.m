//
//  WXAnimatedDisplayLinkIdlingResource.m
//  Detox
//
//  Created by Sergey Ilyevsky on 22/05/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "WXAnimatedDisplayLinkIdlingResource.h"
#import "ReactNativeHeaders.h"

@implementation WXAnimatedDisplayLinkIdlingResource {
}

static NSString * const _RCTNativeAnimatedModuleClass = @"RCTNativeAnimatedModule";
static NSString * const _nodesManagerDisplayLinkPath = @"_nodesManager._displayLink";

+ (BOOL)isAvailable
{
	@try {
		Class animatedModuleClass = NSClassFromString(_RCTNativeAnimatedModuleClass);
		id animatedModule = [[animatedModuleClass alloc] init];

		if(!animatedModule) return NO;
		[animatedModule valueForKeyPath:_nodesManagerDisplayLinkPath];
		return YES;
	} @catch(id ex) {
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
	SEL currentBridgeSelector = @selector(currentBridge);
	if(! [bridgeClass respondsToSelector:currentBridgeSelector]) return YES;
	
	id (*currentBridgeFunction)(id, SEL) = (id (*)(id, SEL))[bridgeClass methodForSelector:currentBridgeSelector];
	id<RN_RCTBridge> bridge = currentBridgeFunction(bridgeClass, currentBridgeSelector);

	Class animatedModuleClass = NSClassFromString(_RCTNativeAnimatedModuleClass);
	id animatedModule = [bridge moduleForClass:animatedModuleClass];
	id displayLink = [animatedModule valueForKeyPath:_nodesManagerDisplayLinkPath];
	return displayLink == nil;
}

@end
