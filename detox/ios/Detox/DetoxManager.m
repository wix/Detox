//
//  DetoxManager.m
//  Detox
//
//  Created by Tal Kol on 6/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "DetoxManager.h"

@interface DetoxManager()

@property (nonatomic, retain) WebSocket *websocket;
@property (nonatomic, retain) TestRunner *testRunner;
@property (nonatomic, retain) ReactNativeSupport *reactNativeSupport;
@property (nonatomic, assign) BOOL isReady;

@end


@implementation DetoxManager

+ (instancetype)sharedInstance
{
    static DetoxManager *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[DetoxManager alloc] init];
    });
    return sharedInstance;
}

- (instancetype)init
{
    self = [super init];
    if (self == nil) return nil;
    
    self.isReady = NO;
    self.websocket = [[WebSocket alloc] init];
    self.websocket.delegate = self;
    self.testRunner = [[TestRunner alloc] init];
    self.testRunner.delegate = self;
    self.reactNativeSupport = [[ReactNativeSupport alloc] init];
    self.reactNativeSupport.delegate = self;
    
    return self;
}

- (void) connectToServer:(NSString*)url withSessionId:(NSString*)sessionId
{
    [self.websocket connectToServer:url withSessionId:sessionId];
}

- (void) websocketDidConnect
{
    if (![self.reactNativeSupport isReactNativeApp])
    {
        self.isReady = YES;
        [self.websocket sendAction:@"ready" withParams:@{}];
    }
}

- (void) websocketDidReceiveAction:(NSString *)type withParams:(NSDictionary *)params
{
    if ([type isEqualToString:@"invoke"])
    {
        [self.testRunner invoke:params];
        return;
    }
    
    if ([type isEqualToString:@"isReady"])
    {
        if (self.isReady)
        {
            [self.websocket sendAction:@"ready" withParams:@{}];
        }
        return;
    }
    
    if ([type isEqualToString:@"cleanup"])
    {
        [self.testRunner cleanup];
        [self.websocket sendAction:@"cleanupDone" withParams:@{}];
        return;
    }
    
    if ([type isEqualToString:@"reactNativeReload"])
    {
        self.isReady = NO;
        [self.reactNativeSupport reloadApp];
        return;
    }
}

- (void)testRunnerOnInvokeResult:(id)res withInvocationId:(NSString *)invocationId
{
    if (res == nil) res = @"(null)";
    if (![res isKindOfClass:[NSString class]] && ![res isKindOfClass:[NSNumber class]])
    {
        res = [NSString stringWithFormat:@"(%@)", NSStringFromClass([res class])];
    }
    [self.websocket sendAction:@"invokeResult" withParams:@{@"id": invocationId, @"result": res}];
}

- (void)testRunnerOnTestFailed:(NSString *)details
{
    if (details == nil) details = @"";
    [self.websocket sendAction:@"testFailed" withParams:@{@"details": details}];
}

- (void)testRunnerOnError:(NSString *)error
{
    if (error == nil) error = @"";
    [self.websocket sendAction:@"error" withParams:@{@"error": error}];
}

- (void)reactNativeAppDidLoad
{
    self.isReady = YES;
    [self.websocket sendAction:@"ready" withParams:@{}];
}

@end
