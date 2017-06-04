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
	id<RN_RCTBridge> _bridge;
}

- (NSString *)idlingResourceName
{
	return NSStringFromClass([self class]);
}

- (NSString *)idlingResourceDescription
{
	return @"Monitors CADisplayLink objects created by React Native AnimatedAnimated";
}

- (BOOL)isIdleNow
{
	id<RN_RCTBridge> bridge = [NSClassFromString(@"RCTBridge") valueForKey:@"currentBridge"];
	id animatedModule = [bridge moduleForClass:NSClassFromString(@"RCTNativeAnimatedModule")];
	id displayLink = [animatedModule valueForKeyPath:@"_nodesManager._displayLink"];
	return displayLink == nil;
}

@end
