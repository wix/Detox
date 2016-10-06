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

+ (dispatch_queue_t)getUIQueueFromBridge:(id)bridge
{
    dispatch_queue_t queue = [[bridge uiManager] methodQueue];
    return queue;
}

// this is a hack since we don't have a public API to check this and we crash over an assertion if we install twice
+ (GREYDispatchQueueIdlingResource*)checkIfDispatchQueueIdlingResourceAlreadyInstalled:(id)bridge
{
    dispatch_queue_t queue = [self getUIQueueFromBridge:bridge];
    return [[GREYDispatchQueueIdlingResource class] performSelector:@selector(grey_resourceForCurrentlyTrackedDispatchQueue:) withObject:queue];
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
    
    // we have an issue that calling unregister on the idling resource (sometimes?)
    GREYDispatchQueueIdlingResource *existing = [self checkIfDispatchQueueIdlingResourceAlreadyInstalled:bridge];
    if (existing != nil)
    {
        // I suspect that we have a race condition and deregister doesn't free the idling resource immediately, need to investigate further
        NSLog(@"Detox Warning: ReactNativeUIManagerIdlingResource already installed and had to be recycled");
        return (ReactNativeUIManagerIdlingResource*)existing;
    }
    
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
    dispatch_queue_t queue = [ReactNativeUIManagerIdlingResource getUIQueueFromBridge:bridge];
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
