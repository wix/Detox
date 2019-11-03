//
//  DetoxTestRunner.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

#import <XCTest/XCTest.h>
#import "XCUIElement+ExtendedTouches.h"
#import "XCUIElement+UIDatePickerSupport.h"
#import "DTXDetoxApplication.h"
#import "WebSocket.h"
#import "DTXLogging.h"
#import "XCTestConfiguration.h"
#import "DetoxUtils.h"

DTX_CREATE_LOG(DetoxTestRunner);

@interface DetoxTestRunner : XCTestCase <WebSocketDelegate>

@end

@implementation DetoxTestRunner
{
	WebSocket *_webSocket;
	DTXDetoxApplication* _testedApplication;
}

- (void)setUp
{
	_webSocket = [[WebSocket alloc] init];
	_webSocket.delegate = self;
	
	[self _reconnectWebSocket];
	
    self.continueAfterFailure = YES;
}

- (void)tearDown
{
}

- (void)testDetoxSuite
{
	NSLog(@"*********************************************************\nArguments: %@\n*********************************************************", NSProcessInfo.processInfo.arguments);
	
//	_testedApplication = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.apple.mobilesafari"];
//	_testedApplication = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.wix.ExampleApp"];
	_testedApplication = [[DTXDetoxApplication alloc] init];
	[_testedApplication launch];
	
	XCUIElement* tableView = _testedApplication.tables.firstMatch;
	[tableView scrollWithOffset:CGVectorMake(0, -200)];
	[tableView tapAtPoint:CGVectorMake(200, 200)];
	
	XCUIElementQuery* query = [[_testedApplication.windows.firstMatch descendantsMatchingType:XCUIElementTypeAny] matchingPredicate:[NSPredicate predicateWithFormat:@"label == 'Second'"]];
	XCUIElement* element = query.firstMatch;
	[element tap];
	
	[[_testedApplication.buttons elementMatchingPredicate:[NSPredicate predicateWithFormat:@"label == 'Second'"]] tap];
	XCUIElement* label = [_testedApplication.staticTexts elementMatchingPredicate:[NSPredicate predicateWithFormat:@"label == 'Second View'"]];
	XCTAssertTrue(label.exists);
	XCTAssertTrue(label.isHittable);
	
	query = [[_testedApplication.windows.firstMatch descendantsMatchingType:XCUIElementTypeAny] matchingPredicate:[NSPredicate predicateWithFormat:@"identifier == 'picker'"]];
	XCUIElement* picker = query.firstMatch;
	
	query = [[_testedApplication.windows.firstMatch descendantsMatchingType:XCUIElementTypeAny] matchingPredicate:[NSPredicate predicateWithFormat:@"identifier == 'TextField'"]];
	XCUIElement* textField = query.firstMatch;
	[textField tap];
	[textField typeText:NSProcessInfo.processInfo.environment[@"DETOX_SERVER_PORT"]];
	[textField typeText:XCUIKeyboardKeyReturn];
	
	[picker ln_adjustToDatePickerDate:[NSDate dateWithTimeIntervalSinceNow:86400 * 1000 - 48200]];
	
	[_testedApplication terminate];
//	[picker ln_adjustToCountDownDuration:27900];
	
//	[NSThread sleepForTimeInterval:2];
//	[NSRunLoop.currentRunLoop runUntilDate:NSDate.distantFuture];
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
		dtx_log_info(@"Using default 'detoxServer': ws://localhost:8099");
	}
	
	if(detoxSessionId == nil)
	{
		detoxSessionId = XCTestConfiguration.activeTestConfiguration.targetApplicationBundleID;
		dtx_log_info(@"Using default 'detoxSessionId': %@", detoxSessionId);
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
	dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
		[self _reconnectWebSocket];
	});
}

- (void)webSocket:(WebSocket*)webSocket didReceiveAction:(NSString*)type withParams:(NSDictionary*)params withMessageId:(NSNumber*)messageId
{
	NSAssert(messageId != nil, @"Got action with a null messageId");
	
	if([type isEqualToString:@"testerDisconnected"])
	{
		[_testedApplication.detoxHelper stopAndCleanupRecordingWithCompletionHandler:^{}];
	}
	else if([type isEqualToString:@"setRecordingState"])
	{
		[_testedApplication.detoxHelper handlePerformanceRecording:params isFromLaunch:NO completionHandler:^ {
			[self _safeSendAction:@"setRecordingStateDone" params:@{} messageId:messageId];
		}];
	}
	else if([type isEqualToString:@"waitForActive"])
	{
		[_testedApplication.detoxHelper waitForApplicationState:UIApplicationStateActive completionHandler:^{
			[self _safeSendAction:@"waitForActiveDone" params:@{} messageId:messageId];
		}];
		return;
	}
	else if([type isEqualToString:@"waitForBackground"])
	{
		[_testedApplication.detoxHelper waitForApplicationState:UIApplicationStateBackground completionHandler:^{
			[self _safeSendAction:@"waitForBackgroundDone" params:@{} messageId:messageId];
		}];
		return;
	}
	else if([type isEqualToString:@"invoke"])
	{
//		[self.testRunner invoke:params withMessageId:messageId];
		return;
	}
	else if([type isEqualToString:@"isReady"])
	{
		[self _sendGeneralReadyMessage];
		return;
	}
	//TODO: ???
	else if([type isEqualToString:@"cleanup"])
	{
		[self _safeSendAction:@"cleanupDone" params:@{} messageId:messageId];
		return;
	}
	else if([type isEqualToString:@"deliverPayload"])
	{
		[_testedApplication.detoxHelper deliverPayload:params completionHandler:^{
			[self _safeSendAction:@"deliverPayloadDone" params:@{} messageId:messageId];
		}];
	}
	else if([type isEqualToString:@"shakeDevice"])
	{
		//TODO: Implement shake!
//		[EarlGrey detox_safeExecuteSync:^{
//			[GREYSyntheticEvents shakeDeviceWithError:NULL];
//
//			[self _safeSendAction:@"shakeDeviceDone" params:@{} messageId:messageId];
//		}];
	}
	else if([type isEqualToString:@"reactNativeReload"])
	{
		[_testedApplication.detoxHelper reloadReactNativeWithCompletionHandler:^{
			[self _safeSendAction:@"reactNativeReloadDone" params:@{} messageId:messageId];
		}];
		
		return;
	}
	else if([type isEqualToString:@"currentStatus"])
	{
		//TODO: Format changed!
		
		[_testedApplication.detoxHelper syncStatusWithCompletionHandler:^(NSString * _Nonnull information) {
			[self _safeSendAction:@"currentStatusResult" params:@{@"messageId": messageId, @"syncStatus": information} messageId:messageId];
		}];
	}
}

- (void)webSocket:(WebSocket*)webSocket didCloseWithReason:(NSString*)reason
{
	dtx_log_error(@"Web socket closed with reason: %@", reason);
	
	//The web socket connection closed, so terminate all tested applications and finally exist the process.
	[_testedApplication.detoxHelper stopAndCleanupRecordingWithCompletionHandler:^ {}];
	//Only terminated tested app if debugger is not attached.
	[_testedApplication.detoxHelper isDebuggerAttachedWithCompletionHandler:^(BOOL isDebuggerAttached) {
		if(isDebuggerAttached == NO)
		{
			[_testedApplication terminate];
		}
	}];
	
	//Only exist test runner process if debugger is not attached.
	if(DTXIsDebuggerAttached() == NO)
	{
		exit(0);
	}
}

@end
