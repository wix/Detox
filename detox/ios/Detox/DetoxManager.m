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
#import "EarlGreyExtensions.h"
#import "EarlGreyStatistics.h"

DTX_CREATE_LOG(DetoxManager)

@interface DetoxManager()

@property (nonatomic) BOOL isReady;
@property (nonatomic, retain) WebSocket *websocket;
@property (nonatomic, retain) TestRunner *testRunner;

@end

__attribute__((constructor))
static void detoxConditionalInit()
{
	//This forces accessibility support in the application.
	[[[NSUserDefaults alloc] initWithSuiteName:@"com.apple.Accessibility"] setBool:YES forKey:@"ApplicationAccessibilityEnabled"];
	
	//Timeout will be regulated by mochaJS. Perhaps it would be best to somehow pass the timeout value from JS to here. For now, this will do.
	[[GREYConfiguration sharedInstance] setDefaultValue:@(DBL_MAX) forConfigKey:kGREYConfigKeyInteractionTimeoutDuration];
	
	NSUserDefaults* options = [NSUserDefaults standardUserDefaults];
	
	NSString *detoxServer = [options stringForKey:@"detoxServer"];
	NSString *detoxSessionId = [options stringForKey:@"detoxSessionId"];
	if (!detoxServer || !detoxSessionId)
	{
		dtx_log_error(@"Either 'detoxServer' and/or 'detoxSessionId' arguments are missing; failing Detox.");
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
		[self _waitForRNLoadWithId:@0];
	}
	
	return self;
}

- (void)connectToServer:(NSString*)url withSessionId:(NSString*)sessionId
{
	[self.websocket connectToServer:url withSessionId:sessionId];
}

- (void)websocketDidConnect
{
	if (![ReactNativeSupport isReactNativeApp])
	{
		_isReady = YES;
		[self.websocket sendAction:@"ready" withParams:@{} withMessageId: @-1000];
	}
}

- (void)websocketDidReceiveAction:(NSString *)type withParams:(NSDictionary *)params withMessageId:(NSNumber *)messageId
{
	NSAssert(messageId != nil, @"Got action with a null messageId");
	
	if([type isEqualToString:@"invoke"])
	{
		[self.testRunner invoke:params withMessageId: messageId];
		return;
	}
	else if([type isEqualToString:@"isReady"])
	{
		if(_isReady)
		{
			[self.websocket sendAction:@"ready" withParams:@{} withMessageId: @-1000];
		}
		return;
	}
	else if([type isEqualToString:@"cleanup"])
	{
		[self.testRunner cleanup];
		[self.websocket sendAction:@"cleanupDone" withParams:@{} withMessageId: messageId];
		return;
	}
	else if([type isEqualToString:@"userNotification"])
	{
		[EarlGrey detox_safeExecuteSync:^{
			NSURL* userNotificationDataURL = [NSURL fileURLWithPath:params[@"detoxUserNotificationDataURL"]];
			DetoxUserNotificationDispatcher* dispatcher = [[DetoxUserNotificationDispatcher alloc] initWithUserNotificationDataURL:userNotificationDataURL];
			[dispatcher dispatchOnAppDelegate:DetoxAppDelegateProxy.currentAppDelegateProxy simulateDuringLaunch:NO];
			[self.websocket sendAction:@"userNotificationDone" withParams:@{} withMessageId: messageId];
		}];
	}
	else if([type isEqualToString:@"openURL"])
	{
		[EarlGrey detox_safeExecuteSync:^{
			NSURL* URLToOpen = [NSURL URLWithString:params[@"url"]];
			
			NSParameterAssert(URLToOpen != nil);
			
			NSString* sourceApp = params[@"sourceApp"];
			
			NSMutableDictionary* options = [@{UIApplicationLaunchOptionsURLKey: URLToOpen} mutableCopy];
			if(sourceApp != nil)
			{
				options[UIApplicationLaunchOptionsSourceApplicationKey] = sourceApp;
			}
			
			if([[UIApplication sharedApplication].delegate respondsToSelector:@selector(application:openURL:options:)])
			{
				[[UIApplication sharedApplication].delegate application:[UIApplication sharedApplication] openURL:URLToOpen options:options];
			}
			
			[self.websocket sendAction:@"openURLDone" withParams:@{} withMessageId: messageId];
		}];
	}
	else if([type isEqualToString:@"shakeDevice"])
	{
		
	}
	else if([type isEqualToString:@"reactNativeReload"])
	{
		_isReady = NO;
		[EarlGrey detox_safeExecuteSync:^{
			[ReactNativeSupport reloadApp];
		}];
		
		[self _waitForRNLoadWithId:messageId];
		
		return;
	}
	else if([type isEqualToString:@"currentStatus"])
	{
		NSMutableDictionary* statsStatus = [[[EarlGreyStatistics sharedInstance] currentStatus] mutableCopy];
		statsStatus[@"messageId"] = messageId;
		
		[self.websocket sendAction:@"currentStatusResult" withParams:statsStatus withMessageId: messageId];
	}
}

- (void)_waitForRNLoadWithId:(id)messageId
{
	__weak __typeof(self) weakSelf = self;
	[ReactNativeSupport waitForReactNativeLoadWithCompletionHandler:^{
		weakSelf.isReady = YES;
		[weakSelf.websocket sendAction:@"ready" withParams:@{} withMessageId: @-1000];
	}];
}

- (void)testRunnerOnInvokeResult:(id)res withMessageId:(NSNumber *)messageId
{
	if (res == nil) res = @"(null)";
	if (![res isKindOfClass:[NSString class]] && ![res isKindOfClass:[NSNumber class]])
	{
		res = [NSString stringWithFormat:@"(%@)", NSStringFromClass([res class])];
	}
	[self.websocket sendAction:@"invokeResult" withParams:@{@"result": res} withMessageId: messageId];
}

- (void)testRunnerOnTestFailed:(NSString *)details withMessageId:(NSNumber *) messageId
{
	if (details == nil) details = @"";
	[self.websocket sendAction:@"testFailed" withParams:@{@"details": details} withMessageId: messageId];
}

- (void)testRunnerOnError:(NSString *)error withMessageId:(NSNumber *) messageId
{
	if (error == nil) error = @"";
	[self.websocket sendAction:@"error" withParams:@{@"error": error} withMessageId: messageId];
}

@end
