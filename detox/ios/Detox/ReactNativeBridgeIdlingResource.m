//
//  ReactNativeBridgeIdlingResource.m
//  Detox
//
//  Created by Tal Kol on 8/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeHeaders.h"
#import "ReactNativeBridgeIdlingResource.h"
#import "Common/GREYDefines.h"
#import "Common/GREYPrivate.h"

typedef enum {
    kWaiting,
    kBusy,
    kIdle
} IdlingCheckState;

@implementation ReactNativeBridgeIdlingResource
{
    NSString *_name;
    id<RN_RCTBridge> _bridge;
    IdlingCheckState _state;
    int _consecutiveIdles;
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
    ReactNativeBridgeIdlingResource *res = [[ReactNativeBridgeIdlingResource alloc] initWithBridge:bridge name:name];
    [[GREYUIThreadExecutor sharedInstance] registerIdlingResource:res];
    return res;
}

+ (void)deregister:(ReactNativeBridgeIdlingResource*)instance
{
    [[GREYUIThreadExecutor sharedInstance] deregisterIdlingResource:instance];
}

- (instancetype)initWithBridge:(id<RN_RCTBridge>)bridge name:(NSString *)name
{
    self = [super init];
    if (self)
    {
        _name = [name copy];
        _bridge = bridge;
        _state = kBusy;
        _consecutiveIdles = 0;
    }
    return self;
}

#pragma mark - GREYIdlingResource

- (NSString *)idlingResourceName {
    return _name;
}

- (NSString *)idlingResourceDescription {
    return _name;
}

- (BOOL)isIdleNow
{
    if (_bridge == nil) return NO;
    if (![_bridge isValid] || [_bridge isLoading]) return NO;
    id<RN_RCTJavaScriptExecutor> executor = [_bridge valueForKey:@"javaScriptExecutor"];
    if (executor == nil) return NO;
    
    if (_state == kIdle)
    {
        _consecutiveIdles++;
    }
    else
    {
        _consecutiveIdles = 0;
    }
    if (_state != kWaiting)
    {
        _state = kWaiting;
        [executor executeBlockOnJavaScriptQueue:^{
            [executor flushedQueue:^(id json, NSError *error) {
                if (error == nil && json != nil) _state = kBusy;
                else _state = kIdle;
            }];
        }];
    }
    BOOL res = NO;
    if (_consecutiveIdles > 2) res = YES;
    // NSLog(@"ReactNativeBridgeIdlingResource:    idle=%d (%d)", res, _consecutiveIdles);
    return res;
}

@end
