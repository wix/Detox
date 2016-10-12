//
//  ReactNativeBridgeIdlingResource.m
//  Detox
//
//  Created by Tal Kol on 8/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeHeaders.h"
#import "ReactNativeBridgeIdlingResource.h"

#import "EarlGreyExtensions.h"

static const CGFloat MOVING_AVERAGE_WEIGHT = 0.2;
static const CGFloat MIN_THRESHOLD_FOR_IDLE = 10;

// save this state variable between RN reloads
static NSTimeInterval _timeToIdleMin = 1.0;

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
    NSTimeInterval _lastIdleTime;
    NSTimeInterval _timeToIdleAvg;
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
        _lastIdleTime = CACurrentMediaTime();
        _timeToIdleAvg = 0;
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
    NSTimeInterval time = CACurrentMediaTime();
    NSTimeInterval timeSoFar = time - _lastIdleTime;
    
    if (_bridge == nil) return NO;
    if (![_bridge isValid] || [_bridge isLoading]) return NO;
    id<RN_RCTJavaScriptExecutor> executor = [_bridge valueForKey:@"javaScriptExecutor"];
    if (executor == nil) return NO;
    
    BOOL wasIdle = NO;
    if (_state == kIdle)
    {
        wasIdle = YES;
        NSTimeInterval idleTime = CACurrentMediaTime();
        _timeToIdleAvg = (1.0 - MOVING_AVERAGE_WEIGHT) * _timeToIdleAvg + MOVING_AVERAGE_WEIGHT * timeSoFar;
        if (_timeToIdleAvg < _timeToIdleMin) _timeToIdleMin = _timeToIdleAvg;
        _lastIdleTime = idleTime;
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
    
    // consider if (timeSoFar < MIN_THRESHOLD_FOR_IDLE * _timeToIdleMin) only
    if (timeSoFar < MIN_THRESHOLD_FOR_IDLE * _timeToIdleMin && _timeToIdleAvg < MIN_THRESHOLD_FOR_IDLE * _timeToIdleMin) res = YES;
    
    // NSLog(@"idle=%d, timeSoFar = %f, avg = %f, min = %f", res, timeSoFar, _timeToIdleAvg, _timeToIdleMin);
    // NSLog(@"ReactNativeBridgeIdlingResource:    idle=%d (%d)", res, _consecutiveIdles);
    return res;
}

@end
