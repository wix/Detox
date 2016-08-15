//
//  ReactNativeUIManagerIdlingResource.m
//  Detox
//
//  Created by Tal Kol on 8/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeHeaders.h"
#import "ReactNativeUIManagerIdlingResource.h"
#import "Common/GREYDefines.h"
#import "Common/GREYPrivate.h"


@interface GREYDispatchQueueIdlingResource (ReactNativeUIManagerIdlingResource)
- (instancetype)initWithDispatchQueue:(dispatch_queue_t)queue name:(NSString *)name;
@end


@implementation ReactNativeUIManagerIdlingResource
{
    id<RN_RCTBridge> _bridge;
}

+ (instancetype)idlingResourceForBridge:(id)bridge name:(NSString *)name
{
    if (bridge == nil)
    {
        Class<RN_RCTBridge> RCTBridge = NSClassFromString(@"RCTBridge");
        if (RCTBridge == nil) return nil;
        bridge = [RCTBridge currentBridge];
    }
    
    if (bridge == nil) return nil;
    ReactNativeUIManagerIdlingResource *res = [[ReactNativeUIManagerIdlingResource alloc] initWithBridge:bridge name:name];
    [[GREYUIThreadExecutor sharedInstance] registerIdlingResource:res];
    return res;
}

+ (void)deregister:(ReactNativeUIManagerIdlingResource*)instance
{
    [[GREYUIThreadExecutor sharedInstance] deregisterIdlingResource:instance];
}

- (instancetype)initWithBridge:(id<RN_RCTBridge>)bridge name:(NSString *)name
{
    dispatch_queue_t queue = [[bridge uiManager] methodQueue];
    self = [super initWithDispatchQueue:queue name:name];
    if (self)
    {
        _bridge = bridge;
    }
    return self;
}

- (BOOL)isIdleNow
{
    if (_bridge == nil) return NO;
    if (![_bridge isValid] || [_bridge isLoading]) return NO;
    
    BOOL res = [super isIdleNow];
    // NSLog(@"ReactNativeUIManagerIdlingResource: idle=%d", res);
    return res;
}

@end
