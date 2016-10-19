//
//  DetoxManager.m
//  Detox
//
//  Created by Tal Kol on 6/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "DetoxManager.h"
#import <dlfcn.h>

@interface DetoxManager()

@property (nonatomic, retain) WebSocket *websocket;
@property (nonatomic, retain) TestRunner *testRunner;

@end

__attribute__((constructor))
static void detoxConditionalInit()
{
	//Timeout will be regulated by mochaJS. Perhaps it would be best to somehow pass the timeout value from JS to here. For now, this will do.
	[[GREYConfiguration sharedInstance] setDefaultValue:@(DBL_MAX) forConfigKey:kGREYConfigKeyInteractionTimeoutDuration];
	
	NSUserDefaults* options = [NSUserDefaults standardUserDefaults];
	
	// options (standardUserDefaults) include command line arguments:
	// MyApplication -detoxServer "http://localhost:8099" -detoxSessionId "example"
	
	NSString *detoxServer = [options stringForKey:@"detoxServer"];
	NSString *detoxSessionId = [options stringForKey:@"detoxSessionId"];
	if (!detoxServer || !detoxSessionId)
	{
		// if these args were not provided as part of options, don't start Detox at all!
		return;
	}
	
	[[DetoxManager sharedInstance] connectToServer:detoxServer withSessionId:detoxSessionId];
}


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
	
	self.websocket = [[WebSocket alloc] init];
	self.websocket.delegate = self;
	self.testRunner = [[TestRunner alloc] init];
	self.testRunner.delegate = self;
	
	return self;
}

- (void) connectToServer:(NSString*)url withSessionId:(NSString*)sessionId
{
	[self.websocket connectToServer:url withSessionId:sessionId];
}

- (void) websocketDidConnect
{
	if (![ReactNativeSupport isReactNativeApp])
	{
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
		[self.websocket sendAction:@"ready" withParams:@{}];
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
		[ReactNativeSupport reloadApp];
		
		__block __weak id observer;
		__weak __typeof(self) weakSelf = self;
		
		observer = [[NSNotificationCenter defaultCenter] addObserverForName:@"RCTContentDidAppearNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
			
			[weakSelf.websocket sendAction:@"ready" withParams:@{}];
			
			[[NSNotificationCenter defaultCenter] removeObserver:observer];
		}];
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

@end
