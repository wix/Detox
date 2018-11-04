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
	
	NSArray *blacklistRegex = [options arrayForKey:@"detoxURLBlacklistRegex"];
	if (blacklistRegex){
		[[GREYConfiguration sharedInstance] setValue:blacklistRegex forConfigKey:kGREYConfigKeyURLBlacklistRegex];
	}
	
	NSString *detoxServer = [options stringForKey:@"detoxServer"];
	NSString *detoxSessionId = [options stringForKey:@"detoxSessionId"];
	
	if(detoxServer == nil)
	{
		detoxServer = @"ws://localhost:8099";
		dtx_log_info(@"Using default 'detoxServer': ws://localhost:8099");
	}
	
	if(detoxSessionId == nil)
	{
		detoxSessionId = NSBundle.mainBundle.bundleIdentifier;
		dtx_log_info(@"Using default 'detoxSessionId': %@", NSBundle.mainBundle.bundleIdentifier);
	}
	
	NSNumber* waitForDebugger = [options objectForKey:@"detoxWaitForDebugger"];
	if(waitForDebugger)
	{
		usleep(waitForDebugger.unsignedIntValue * 1000);
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
	
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appDidLaunch:) name:UIApplicationDidFinishLaunchingNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_appDidEnterBackground:) name:UIApplicationDidEnterBackgroundNotification object:nil];
	
	return self;
}

- (void)_appDidEnterBackground:(NSNotification*)note
{
	__block UIBackgroundTaskIdentifier bgTask;
	bgTask = [UIApplication.sharedApplication beginBackgroundTaskWithName:@"DetoxBackground" expirationHandler:^{
		[UIApplication.sharedApplication endBackgroundTask:bgTask];
	}];
}

- (void)_appDidLaunch:(NSNotification*)note
{
	[EarlGrey detox_safeExecuteSync:^{
		self.isReady = YES;
		[self _sendGeneralReadyMessage];
	}];
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
		[self _safeSendAction:@"ready" params:@{} messageId:@-1000];
	}
}

- (void)_safeSendAction:(NSString*)action params:(NSDictionary*)params messageId:(NSNumber*)messageId
{
	[EarlGrey detox_safeExecuteSync:^{
		[self.webSocket sendAction:action withParams:params withMessageId:messageId];
	}];
}

- (void)websocketDidReceiveAction:(NSString *)type withParams:(NSDictionary *)params withMessageId:(NSNumber *)messageId
{
	NSAssert(messageId != nil, @"Got action with a null messageId");
	
	if([type isEqualToString:@"waitForIdle"])
	{
		[self _safeSendAction:@"waitForIdleDone" params:@{} messageId:messageId];
	}
	else if([type isEqualToString:@"invoke"])
	{
		[self.testRunner invoke:params withMessageId:messageId];
		return;
	}
	else if([type isEqualToString:@"isReady"])
	{
		if(_isReady)
		{
			[self _safeSendAction:@"ready" params:@{} messageId:@-1000];
		}
		return;
	}
	else if([type isEqualToString:@"cleanup"])
	{
		[self.testRunner cleanup];
		[self.webSocket sendAction:@"cleanupDone" withParams:@{} withMessageId:messageId];
		return;
	}
	else if([type isEqualToString:@"deliverPayload"])
	{
		BOOL delay = [params[@"delayPayload"] boolValue];
		
		void (^block)(void);
		//Send webSocket and messageId as params so the block is of global type, instead of being allocated on every message.
		void (^sendDoneAction)(WebSocket* webSocket, NSNumber* messageId) = ^ (WebSocket* webSocket, NSNumber* messageId) {
			[self _safeSendAction:@"deliverPayloadDone" params:@{} messageId:messageId];
		};
		
		if(params[@"url"])
		{
			NSURL* URLToOpen = [NSURL URLWithString:params[@"url"]];
			
			NSParameterAssert(URLToOpen != nil);
			
			NSString* sourceApp = params[@"sourceApp"];
			
			NSMutableDictionary* options = [@{UIApplicationLaunchOptionsURLKey: URLToOpen} mutableCopy];
			if(sourceApp != nil)
			{
				options[UIApplicationLaunchOptionsSourceApplicationKey] = sourceApp;
			}
			
			block = ^{
				[DetoxAppDelegateProxy.currentAppDelegateProxy __dtx_dispatchOpenURL:URLToOpen options:options delayUntilActive:delay];
				
				sendDoneAction(self.webSocket, messageId);
			};
		}
		else if(params[@"detoxUserNotificationDataURL"])
		{
			NSURL* userNotificationDataURL = [NSURL fileURLWithPath:params[@"detoxUserNotificationDataURL"]];
			
			NSParameterAssert(userNotificationDataURL != nil);
			
			block = ^{
				[DetoxAppDelegateProxy.currentAppDelegateProxy __dtx_dispatchUserNotificationFromDataURL:userNotificationDataURL delayUntilActive:delay];
				
				sendDoneAction(self.webSocket, messageId);
			};
		}
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_10_3
		else if(params[@"detoxUserActivityDataURL"])
		{
			NSURL* userActivityDataURL = [NSURL fileURLWithPath:params[@"detoxUserActivityDataURL"]];
			
			NSParameterAssert(userActivityDataURL != nil);
			
			block = ^{
				[DetoxAppDelegateProxy.currentAppDelegateProxy __dtx_dispatchUserActivityFromDataURL:userActivityDataURL delayUntilActive:delay];
				
				sendDoneAction(self.webSocket, messageId);
			};
		}
#endif
		
		NSAssert(block != nil, @"Logic error, no block was generated for payload: %@", params);
		
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
			
			[self _safeSendAction:@"shakeDeviceDone" params:@{} messageId:messageId];
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
	
	[self _safeSendAction:@"invokeResult" params:@{@"result": res} messageId:messageId];
}

- (void)testRunnerOnTestFailed:(NSString *)details withMessageId:(NSNumber *) messageId
{
	if (details == nil) details = @"";
	[self _safeSendAction:@"testFailed" params:@{@"details": details} messageId:messageId];
}

- (void)testRunnerOnError:(NSString *)error withMessageId:(NSNumber *) messageId
{
	if (error == nil) error = @"";
	[self _safeSendAction:@"error" params:@{@"error": error} messageId:messageId];
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
