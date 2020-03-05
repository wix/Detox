//
//  DetoxTestRunner.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

#import <XCTest/XCTest.h>
#import "XCUIElement+ExtendedTouches.h"
#import "XCUIElement+UIDatePickerSupport.h"
#import "XCUIElement+ExtendedText.h"
#import "DTXDetoxApplication.h"
#import "WebSocket.h"
#import "DTXLogging.h"
#import "XCTestConfiguration.h"
#import "DetoxUtils.h"
#import "DetoxTestRunner-Swift.h"
@import Darwin;

DTX_CREATE_LOG(DetoxTestRunner);

@interface DetoxTestRunner : XCTestCase <WebSocketDelegate, DTXDetoxApplicationDelegate>

@end

@implementation DetoxTestRunner
{
	WebSocket *_webSocket;
	DTXDetoxApplication* _testedApplication;
	DTXInvocationManager* _testedApplicationInvocationManager;
	
	NSMutableArray<dispatch_block_t>* _pendingActions;
	pthread_mutex_t _pendingActionsMutex;
	dispatch_semaphore_t _pendingActionsAvailable;
}

+ (XCTestSuite *)defaultTestSuite
{
	XCTestSuite* rv = [[XCTestSuite alloc] initWithName:@"Detox Test Suite"];
	
	[rv addTest:[[DetoxTestRunner alloc] initWithSelector:@selector(testDetoxSuite)]];
	
	return rv;
}

- (instancetype)initWithSelector:(SEL)selector
{
	self = [super initWithSelector:selector];
	
	if(self)
	{
		_pendingActions = [NSMutableArray new];
		pthread_mutex_init(&_pendingActionsMutex, NULL);
		_pendingActionsAvailable = dispatch_semaphore_create(0);
		
		_webSocket = [WebSocket new];
		_webSocket.delegate = self;
		
		[self _reconnectWebSocket];
		
		self.continueAfterFailure = YES;
	}
	
	return self;
}

- (void)dealloc
{
	pthread_mutex_destroy(&_pendingActionsMutex);
}

- (void)_replaceActionsQueue:(NSArray<dispatch_block_t>*)actions
{
	BOOL needsSignal = NO;
	pthread_mutex_lock(&_pendingActionsMutex);
	[_pendingActions removeAllObjects];
	[_pendingActions addObjectsFromArray:actions];
	if(actions.count > 0)
	{
		needsSignal = YES;
	}
	pthread_mutex_unlock(&_pendingActionsMutex);
	
	if(needsSignal)
	{
		dispatch_semaphore_signal(_pendingActionsAvailable);
	}
}

- (void)_enqueueAction:(dispatch_block_t)action
{
	pthread_mutex_lock(&_pendingActionsMutex);
	[_pendingActions addObject:action];
	pthread_mutex_unlock(&_pendingActionsMutex);
	dispatch_semaphore_signal(_pendingActionsAvailable);
}

- (dispatch_block_t)_dequeueAction
{
	dispatch_semaphore_wait(_pendingActionsAvailable, DISPATCH_TIME_FOREVER);
	pthread_mutex_lock(&_pendingActionsMutex);
	dispatch_block_t action = _pendingActions.firstObject;
	[_pendingActions removeObjectAtIndex:0];
	pthread_mutex_unlock(&_pendingActionsMutex);
	
	return action;
}

- (void)recordFailureWithDescription:(NSString *)description inFile:(NSString *)filePath atLine:(NSUInteger)lineNumber expected:(BOOL)expected
{
	NSString* tree = [_testedApplication debugDescription];
	
	[[NSException exceptionWithName:@"DTXTestFailure" reason:@"Test execution failed" userInfo:@{@"failureReason": description, @"appTree": tree}] raise];
}

- (void)testDetoxSuite
{
	NSLog(@"*********************************************************\nArguments: %@\n*********************************************************", NSProcessInfo.processInfo.arguments);
	
//	_testedApplication = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.apple.mobilesafari"];
//	_testedApplication = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.wix.ExampleApp"];
	//TODO: Obtain application bundle identifier from environment variables or launch arguments.
	_testedApplication = [[DTXDetoxApplication alloc] init];
	_testedApplication.delegate = self;
	_testedApplicationInvocationManager = [[DTXInvocationManager alloc] initWithApplication:_testedApplication];
	
//	[self webSocket:nil didReceiveAction:@"launch" withParams:nil withMessageId:@10];
//	[self webSocket:nil didReceiveAction:@"invoke" withParams:[NSDictionary dictionaryWithContentsOfURL:[[NSBundle bundleForClass:DetoxTestRunner.class] URLForResource:@"tap-bad" withExtension:@"plist"]] withMessageId:@1];
//	[self webSocket:nil didReceiveAction:@"launch" withParams:nil withMessageId:@10];
//	[self webSocket:nil didReceiveAction:@"invoke" withParams:[NSDictionary dictionaryWithContentsOfURL:[[NSBundle bundleForClass:DetoxTestRunner.class] URLForResource:@"tap" withExtension:@"plist"]] withMessageId:@2];
	
	do {
		dispatch_block_t action = [self _dequeueAction];
		action();
	} while (true);
}

- (void)_cleanUpAndTerminateIfNeeded
{
	//The web socket connection closed, so terminate all tested applications and finally exist the process.
	[_testedApplication.detoxHelper stopAndCleanupRecordingWithCompletionHandler:^ {}];
	//Only terminated tested app if debugger is not attached.
	[_testedApplication.detoxHelper isDebuggerAttachedWithCompletionHandler:^(BOOL isDebuggerAttached) {
		if(isDebuggerAttached == NO)
		{
			[self _terminateApplicationWithParameters:nil completionHandler:nil];
		}
	}];
	
	//Only exist test runner process if debugger is not attached.
	if(DTXIsDebuggerAttached() == NO)
	{
		exit(0);
	}
}

- (void)_launchApplicationWithParameters:(NSDictionary*)params completionHandler:(dispatch_block_t)completionHandler
{
	NSDictionary* userActivity = params[@"userActivity"];
	NSDictionary* userNotification = [DetoxUserNotificationParser parseUserNotificationWithDictionary:params[@"userNotification"]];
	
	_testedApplication.launchUserActivity = userActivity;
	_testedApplication.launchUserNotification = userNotification;
	_testedApplication.launchOpenURL = [NSURL URLWithString:params[@"url"]];
	_testedApplication.launchSourceApp = params[@"sourceApp"];
	
	_testedApplication.launchArguments = params[@"launchArgs"];
	
	if([params[@"newInstance"] boolValue])
	{
		[_testedApplication launch];
	}
	else
	{
		[_testedApplication activate];
	}
	
	if(completionHandler)
	{
		completionHandler();
	}
}

- (void)_terminateApplicationWithParameters:(NSDictionary*)params completionHandler:(dispatch_block_t)completionHandler
{
	[_testedApplication terminate];
	
	if(completionHandler)
	{
		completionHandler();
	}
}

- (void)_cleanupActionsQueueAndTerminateIfNeeded
{
	[self _replaceActionsQueue:@[^ {
		[self _cleanUpAndTerminateIfNeeded];
	}]];
}

#pragma mark WebSocket

- (void)_safeSendAction:(NSString*)action params:(NSDictionary*)params messageId:(NSNumber*)messageId
{
	[_webSocket sendAction:action withParams:params withMessageId:messageId];
}

- (void)_sendGeneralReadyMessage
{
	[self _safeSendAction:@"ready" params:@{} messageId:@-1000];
}

- (void)_reconnectWebSocket
{
	NSUserDefaults* options = NSUserDefaults.standardUserDefaults;
	NSString *detoxServer = [options stringForKey:@"detoxServer"];
	NSString *detoxSessionId = [options stringForKey:@"detoxSessionId"];
	
	if(detoxServer == nil)
	{
		detoxServer = @"ws://localhost:8099";
//		dtx_log_info(@"Using default 'detoxServer': ws://localhost:8099");
	}
	
	if(detoxSessionId == nil)
	{
		detoxSessionId = XCTestConfiguration.activeTestConfiguration.targetApplicationBundleID;
//		dtx_log_info(@"Using default 'detoxSessionId': %@", detoxSessionId);
	}
	
	if(detoxSessionId == nil)
	{
		dtx_log_error(@"No detoxSessionId provided and no targetApplicationBundleID available");
	}

	NSAssert(detoxSessionId != nil, @"No detoxSessionId provided and no targetApplicationBundleID available");
	
	[_webSocket connectToServer:detoxServer withSessionId:detoxSessionId];
}

- (void)webSocketDidConnect:(WebSocket*)webSocket
{
	[self _sendGeneralReadyMessage];
}

- (void)webSocket:(WebSocket*)webSocket didFailWithError:(NSError*)error
{
	dtx_log_error(@"Web socket failed to connect with error: %@", error);
	
	//Retry server connection
	dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), _webSocket.delegateQueue, ^{
		[self _reconnectWebSocket];
	});
}

- (void)webSocket:(WebSocket*)webSocket didReceiveAction:(NSString*)type withParams:(NSDictionary*)params withMessageId:(NSNumber*)messageId
{
	NSAssert(messageId != nil, @"Got action with a null messageId");
	
	if([type isEqualToString:@"testerDisconnected"])
	{
		[self _cleanupActionsQueueAndTerminateIfNeeded];
		return;
	}
	else if([type isEqualToString:@"setRecordingState"])
	{
		[self _enqueueAction:^{
			[_testedApplication.detoxHelper handlePerformanceRecording:params isFromLaunch:NO completionHandler:^ {
				[self _safeSendAction:@"setRecordingStateDone" params:@{} messageId:messageId];
			}];
		}];
		return;
	}
	else if([type isEqualToString:@"waitForActive"])
	{
		[self _enqueueAction:^{
			[_testedApplication.detoxHelper waitForApplicationState:UIApplicationStateActive completionHandler:^{
				[self _safeSendAction:@"waitForActiveDone" params:@{} messageId:messageId];
			}];
		}];
		return;
	}
	else if([type isEqualToString:@"waitForBackground"])
	{
		[self _enqueueAction:^{
			[_testedApplication.detoxHelper waitForApplicationState:UIApplicationStateBackground completionHandler:^{
				[self _safeSendAction:@"waitForBackgroundDone" params:@{} messageId:messageId];
			}];
		}];
		return;
	}
	else if([type isEqualToString:@"invoke"])
	{
		[self _enqueueAction:^{
			[_testedApplication waitForIdleWithTimeout:0];
			@try
			{
				NSDictionary* rv = [_testedApplicationInvocationManager invokeWithDictionaryRepresentation:params];
				if(rv == nil)
				{
					rv = @{};
				}
				
				[self _safeSendAction:@"invokeResult" params:@{@"result": rv} messageId:messageId];
			}
			@catch(NSException* exception)
			{
				NSMutableDictionary* params = @{@"details": exception.reason}.mutableCopy;
				if([exception.name isEqualToString:@"DTXTestFailure"])
				{
					[params addEntriesFromDictionary:exception.userInfo];
				}
				
				[self _safeSendAction:@"testFailed" params:params messageId:messageId];
			}
		}];
		return;
	}
	else if([type isEqualToString:@"isReady"])
	{
		[self _sendGeneralReadyMessage];
		return;
	}
	else if([type isEqualToString:@"cleanup"])
	{
		//TODO: ???
		[self _safeSendAction:@"cleanupDone" params:@{} messageId:messageId];
		return;
	}
	else if([type isEqualToString:@"launch"])
	{
		[self _enqueueAction:^{
			[self _launchApplicationWithParameters:params completionHandler:^{
				[self _safeSendAction:@"launchDone" params:@{} messageId:messageId];
			}];
		}];
		return;
	}
	else if([type isEqualToString:@"terminate"])
	{
		[self _enqueueAction:^{
			[self _terminateApplicationWithParameters:params completionHandler:^{
				[self _safeSendAction:@"terminateDone" params:@{} messageId:messageId];
			}];
		}];
		return;
	}
	else if([type isEqualToString:@"deliverPayload"])
	{
		[self _enqueueAction:^{
			[_testedApplication.detoxHelper deliverPayload:params completionHandler:^{
				[self _safeSendAction:@"deliverPayloadDone" params:@{} messageId:messageId];
			}];
		}];
		return;
	}
	else if([type isEqualToString:@"setOrientation"])
	{
		[self _enqueueAction:^{
			[XCUIDevice.sharedDevice setOrientation:[params[@"orientation"] unsignedIntegerValue]];
		}];
		return;
	}
	else if([type isEqualToString:@"shakeDevice"])
	{
		//TODO: Implement shake!
		return;
	}
	else if([type isEqualToString:@"reactNativeReload"])
	{
		[self _enqueueAction:^{
			[_testedApplication.detoxHelper reloadReactNativeWithCompletionHandler:^{
				[self _safeSendAction:@"reactNativeReloadDone" params:@{} messageId:messageId];
			}];
		}];
		return;
	}
	else if([type isEqualToString:@"currentStatus"])
	{
		//TODO: Format changed!
		[_testedApplication.detoxHelper syncStatusWithCompletionHandler:^(NSString * _Nonnull information) {
			[self _safeSendAction:@"currentStatusResult" params:@{@"messageId": messageId, @"syncStatus": information} messageId:messageId];
		}];
		return;
	}
	else if([type isEqualToString:@"terminateTestRunner"])
	{
		[self _cleanupActionsQueueAndTerminateIfNeeded];
	}
}

- (void)webSocket:(WebSocket*)webSocket didCloseWithReason:(NSString*)reason
{
	dtx_log_error(@"Web socket closed with reason: %@", reason);
	
	[self _cleanupActionsQueueAndTerminateIfNeeded];
}

#pragma mark DTXDetoxApplicationDelegate

- (void)application:(DTXDetoxApplication *)application didCrashWithDetails:(NSDictionary *)details
{
	[self _safeSendAction:@"AppWillTerminateWithError" params:details messageId:@-10000];
}

@end
