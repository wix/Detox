//
//  DetoxManager.m
//  Detox
//
//  Created by Tal Kol on 6/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "DetoxManager.h"
#import <Detox/Detox-Swift.h>
#import "DetoxAppDelegateProxy.h"

@interface DetoxManager()

@property (nonatomic) BOOL isReady;
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
		NSLog(@"☣️ DETOX:: Either 'detoxServer' and/or 'detoxSessionId' arguments are missing; failing Detox.");
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
	
	if([ReactNativeSupport isReactNativeApp])
	{
		[self _waitForRNLoad];
	}
	
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
		_isReady = YES;
		[self.websocket sendAction:@"ready" withParams:@{}];
	}
}

- (void) websocketDidReceiveAction:(NSString *)type withParams:(NSDictionary *)params
{
	if([type isEqualToString:@"invoke"])
	{
		[self.testRunner invoke:params];
		return;
	}
	else if([type isEqualToString:@"isReady"])
	{
		if(_isReady)
		{
			[self.websocket sendAction:@"ready" withParams:@{}];
		}
		return;
	}
	else if([type isEqualToString:@"cleanup"])
	{
		[self.testRunner cleanup];
		[self.websocket sendAction:@"cleanupDone" withParams:@{}];
		return;
	}
	else if([type isEqualToString:@"userNotification"])
	{
		NSURL* userNotificationDataURL = [NSURL fileURLWithPath:params[@"detoxUserNotificationDataURL"]];
		DetoxUserNotificationDispatcher* dispatcher = [[DetoxUserNotificationDispatcher alloc] initWithUserNotificationDataURL:userNotificationDataURL];
		[dispatcher dispatchOnAppDelegate:DetoxAppDelegateProxy.currentAppDelegateProxy.originalAppDelegate simulateDuringLaunch:NO];
		[self.websocket sendAction:@"userNotificationDone" withParams:@{}];
	}
	else if([type isEqualToString:@"reactNativeReload"])
	{
		_isReady = NO;
		[ReactNativeSupport reloadApp];
		
		[self _waitForRNLoad];
		
		return;
	}
}

- (void)_waitForRNLoad
{
	__weak __typeof(self) weakSelf = self;
	[ReactNativeSupport waitForReactNativeLoadWithCompletionHandler:^{
		weakSelf.isReady = YES;
		[weakSelf.websocket sendAction:@"ready" withParams:@{}];
	}];
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
