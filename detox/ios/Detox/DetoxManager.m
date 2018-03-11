//
//  DetoxManager.m
//  Detox
//
//  Created by Tal Kol on 6/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "DetoxManager.h"

#import "WebSocket.h"
#import "TestRunner.h"
#import "ReactNativeSupport.h"

#import <Detox/Detox-Swift.h>
#import "DetoxAppDelegateProxy.h"
#import "EarlGreyExtensions.h"
#import "EarlGreyStatistics.h"

@interface UIApplication ()

- (void)_sendMotionBegan:(UIEventSubtype)arg;
- (void)_sendMotionEnded:(UIEventSubtype)arg;

@end

DTX_CREATE_LOG(DetoxManager)

@interface DetoxManager() <WebSocketDelegate, TestRunnerDelegate>

@property (nonatomic) BOOL isReady;
@property (nonatomic, strong) WebSocket *webSocket;
@property (nonatomic, strong) TestRunner *testRunner;

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
	
	[[DetoxManager sharedManager] connectToServer:detoxServer withSessionId:detoxSessionId];
}

@implementation DetoxManager

+ (instancetype)sharedManager
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
	
	self.webSocket = [[WebSocket alloc] init];
	self.webSocket.delegate = self;
	self.testRunner = [[TestRunner alloc] init];
	self.testRunner.delegate = self;
	
	self.isReady = YES;
	[self _sendGeneralReadyMessage];
	
	return self;
}

- (void)_sendGeneralReadyMessage
{
	[self.webSocket sendAction:@"ready" withParams:@{} withMessageId:@-1000];
}

- (void)connectToServer:(NSString*)url withSessionId:(NSString*)sessionId
{
	[self.webSocket connectToServer:url withSessionId:sessionId];
}

- (void)websocketDidConnect
{
	if (![ReactNativeSupport isReactNativeApp])
	{
		_isReady = YES;
		[self.webSocket sendAction:@"ready" withParams:@{} withMessageId:@-1000];
	}
}

- (void)websocketDidReceiveAction:(NSString *)type withParams:(NSDictionary *)params withMessageId:(NSNumber *)messageId
{
	NSAssert(messageId != nil, @"Got action with a null messageId");
	
	if([type isEqualToString:@"invoke"])
	{
		[self.testRunner invoke:params withMessageId:messageId];
		return;
	}
	else if([type isEqualToString:@"isReady"])
	{
		if(_isReady)
		{
			[self.webSocket sendAction:@"ready" withParams:@{} withMessageId:@-1000];
		}
		return;
	}
	else if([type isEqualToString:@"cleanup"])
	{
		[self.testRunner cleanup];
		[self.webSocket sendAction:@"cleanupDone" withParams:@{} withMessageId:messageId];
		return;
	}
	else if([type isEqualToString:@"userNotification"])
	{
		NSURL* userNotificationDataURL = [NSURL fileURLWithPath:params[@"detoxUserNotificationDataURL"]];
		BOOL delay = [params[@"delayPayload"] boolValue];
		
		void (^block)(void) = ^{
			[DetoxAppDelegateProxy.currentAppDelegateProxy dispatchUserNotificationFromDataURL:userNotificationDataURL delayUntilActive:delay];
			
			[self.webSocket sendAction:@"userNotificationDone" withParams:@{} withMessageId: messageId];
		};
		
		if(delay == YES)
		{
			block();
			return;
		}
		
		[EarlGrey detox_safeExecuteSync:block];
	}
	else if([type isEqualToString:@"openURL"])
	{
		NSURL* URLToOpen = [NSURL URLWithString:params[@"url"]];
		BOOL delay = [params[@"delayPayload"] boolValue];
		
		NSParameterAssert(URLToOpen != nil);
		
		NSString* sourceApp = params[@"sourceApp"];
		
		NSMutableDictionary* options = [@{UIApplicationLaunchOptionsURLKey: URLToOpen} mutableCopy];
		if(sourceApp != nil)
		{
			options[UIApplicationLaunchOptionsSourceApplicationKey] = sourceApp;
		}
		
		void (^block)(void) = ^{
			[DetoxAppDelegateProxy.currentAppDelegateProxy dispatchOpenURL:URLToOpen options:options delayUntilActive:delay];
			
			[self.webSocket sendAction:@"openURLDone" withParams:@{} withMessageId: messageId];
		};
		
		if(delay == YES)
		{
			block();
			return;
		}
		
		[EarlGrey detox_safeExecuteSync:block];
	}
	else if([type isEqualToString:@"shakeDevice"])
	{
		[EarlGrey detox_safeExecuteSync:^{
			[self _sendShakeNotification];
			
			[self.webSocket sendAction:@"shakeDeviceDone" withParams:@{} withMessageId: messageId];
		}];
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
		
		[self.webSocket sendAction:@"currentStatusResult" withParams:statsStatus withMessageId:messageId];
	}
}

- (void)_waitForRNLoadWithId:(id)messageId
{
	__weak __typeof(self) weakSelf = self;
	[ReactNativeSupport waitForReactNativeLoadWithCompletionHandler:^{
		weakSelf.isReady = YES;
		[weakSelf _sendGeneralReadyMessage];
	}];
}

- (void)testRunnerOnInvokeResult:(id)res withMessageId:(NSNumber *)messageId
{
	if (res == nil) res = @"(null)";
	if (![res isKindOfClass:[NSString class]] && ![res isKindOfClass:[NSNumber class]])
	{
		res = [NSString stringWithFormat:@"(%@)", NSStringFromClass([res class])];
	}
	[self.webSocket sendAction:@"invokeResult" withParams:@{@"result": res} withMessageId:messageId];
}

- (void)testRunnerOnTestFailed:(NSString *)details withMessageId:(NSNumber *) messageId
{
	if (details == nil) details = @"";
	[self.webSocket sendAction:@"testFailed" withParams:@{@"details": details} withMessageId:messageId];
}

- (void)testRunnerOnError:(NSString *)error withMessageId:(NSNumber *) messageId
{
	if (error == nil) error = @"";
	[self.webSocket sendAction:@"error" withParams:@{@"error": error} withMessageId:messageId];
}

- (void)notifyOnCrashWithDetails:(NSDictionary*)details
{
	[self.webSocket sendAction:@"AppWillTerminateWithError" withParams:details withMessageId:@-10000];
}

//TODO: Replace once Earl Grey has accepted PR to add this there: https://github.com/google/EarlGrey/pull/679
- (void)_sendShakeNotification
{
	//This behaves exactly in the same manner that UIApplication handles the simulator "Shake Gesture" menu command.
	[[UIApplication sharedApplication] _sendMotionBegan:UIEventSubtypeMotionShake];
	[[UIApplication sharedApplication] _sendMotionEnded:UIEventSubtypeMotionShake];
}

@end
