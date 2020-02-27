//
//  DetoxManager.m
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

#import "DetoxManager.h"
#import "DetoxIPCAPI.h"
#import "UIDatePicker+TestSupport.h"
#import "DetoxAppDelegateProxy.h"
#import "DetoxInstrumentsManager.h"
#import "DetoxUtils.h"
#import "ReactNativeSupport.h"
#import <DetoxIPC/DTXIPCConnection.h>
#import <DetoxSync/DetoxSync.h>
@import ObjectiveC;
@import Darwin;

static DetoxInstrumentsManager* _recordingManager;
static dispatch_queue_t _recordingManagerQueue;

@interface DetoxManager () <DetoxHelper>
{
	DTXIPCConnection* _runnerConnection;
}

@end

@implementation DetoxManager

+ (void)load
{
	@autoreleasepool
	{
		_recordingManagerQueue = dispatch_queue_create("com.wix.detox.recordingManagerQueue", NULL);
		
		[self.sharedManager connect];
		
		[[NSNotificationCenter defaultCenter] addObserver:self.sharedManager selector:@selector(_appDidEnterBackground:) name:UIApplicationDidEnterBackgroundNotification object:nil];
	}
}

+ (instancetype)sharedManager
{
	static DetoxManager* manager;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		manager = [DetoxManager new];
	});
	
	return manager;
}

- (void)connect
{	
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		NSString* serviceName = NSProcessInfo.processInfo.environment[@"DetoxRunnerServiceName"];
		_runnerConnection = [[DTXIPCConnection alloc] initWithServiceName:serviceName];
		_runnerConnection.exportedInterface = [DTXIPCInterface interfaceWithProtocol:@protocol(DetoxHelper)];
		_runnerConnection.exportedObject = self;
		_runnerConnection.remoteObjectInterface = [DTXIPCInterface interfaceWithProtocol:@protocol(DetoxTestRunner)];
		CLANG_IGNORE(-Warc-retain-cycles)
		_runnerConnection.invalidationHandler = ^ {
			[self endDelayingTimePickerEventsWithCompletionHandler:nil];
		};
		CLANG_POP
		
		[[_runnerConnection synchronousRemoteObjectProxyWithErrorHandler:^(NSError * _Nonnull error) {
			NSLog(@"%@", error);
		}] getLaunchArgumentsWithCompletionHandler:^(NSUInteger waitForDebugger, NSURL* recordingURL, NSDictionary<NSString *,id> *userNotification, NSDictionary<NSString *,id> *userActivity, NSURL *openURL, NSString *sourceApp) {
			if(waitForDebugger > 0)
			{
				usleep((useconds_t)(waitForDebugger * 1000));
			}
			
			if(userNotification != nil)
			{
				[DetoxAppDelegateProxy setLaunchUserNotification:userNotification];
			}
			
			if(userActivity != nil)
			{
				[DetoxAppDelegateProxy setLaunchUserActivity:userActivity];
			}
			
			if(openURL)
			{
				NSDictionary* options = @{};
				if(sourceApp)
				{
					options = @{UIApplicationOpenURLOptionsSourceApplicationKey: sourceApp};
				}
				[DetoxAppDelegateProxy setLaunchOpenURL:openURL options:options];
			}
			
			if(recordingURL)
			{
				[self handlePerformanceRecording:NSDictionaryOfVariableBindings(recordingURL) isFromLaunch:YES completionHandler:nil];
			}
		}];
	});
}

- (void)deliverPayload:(NSDictionary*)payload completionHandler:(dispatch_block_t)completionHandler
{
	BOOL delay = [payload[@"delayPayload"] boolValue];
	
	void (^block)(void);
	
	if(payload[@"url"])
	{
		NSURL* URLToOpen = [NSURL URLWithString:payload[@"url"]];
		
		NSParameterAssert(URLToOpen != nil);
		
		NSString* sourceApp = payload[@"sourceApp"];
		
		NSMutableDictionary* options = [@{UIApplicationLaunchOptionsURLKey: URLToOpen} mutableCopy];
		if(sourceApp != nil)
		{
			options[UIApplicationLaunchOptionsSourceApplicationKey] = sourceApp;
		}
		
		block = ^{
			[DetoxAppDelegateProxy.sharedAppDelegateProxy dispatchOpenURL:URLToOpen options:options delayUntilActive:delay];
			
			completionHandler();
		};
	}
	else if(payload[@"detoxUserNotificationDataURL"])
	{
		NSDictionary* userNotification = payload[@"detoxUserNotification"];
		
		NSParameterAssert(userNotification != nil);
		
		block = ^{
			[DetoxAppDelegateProxy.sharedAppDelegateProxy dispatchUserNotification:userNotification delayUntilActive:delay];
			
			completionHandler();
		};
	}
	else if(payload[@"detoxUserActivityDataURL"])
	{
		NSDictionary* userActivity = payload[@"detoxUserActivity"];
		
		NSParameterAssert(userActivity != nil);
		
		block = ^{
			[DetoxAppDelegateProxy.sharedAppDelegateProxy dispatchUserActivity:userActivity delayUntilActive:delay];
			
			completionHandler();
		};
	}
	
	NSAssert(block != nil, @"Logic error, no block was generated for payload: %@", payload);
	
	if(delay == YES)
	{
		block();
		return;
	}
	
	[DTXSyncManager enqueueIdleBlock:block queue:dispatch_get_main_queue()];
}

- (void)_appDidEnterBackground:(NSNotification*)note
{
	__block UIBackgroundTaskIdentifier bgTask;
	bgTask = [UIApplication.sharedApplication beginBackgroundTaskWithName:@"DetoxBackground" expirationHandler:^{
		[UIApplication.sharedApplication endBackgroundTask:bgTask];
	}];
}

- (void)notifyOnCrashWithDetails:(NSDictionary*)details;
{
	dispatch_semaphore_t semaphore = dispatch_semaphore_create(1);

	[self stopAndCleanupRecordingWithCompletionHandler:^{
		dispatch_semaphore_signal(semaphore);
	}];
	
	dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
	
	[_runnerConnection.remoteObjectProxy notifyOnCrashWithDetails:details];
}

- (void)waitForIdleWithCompletionHandler:(dispatch_block_t)completionHandler
{
	[DTXSyncManager enqueueIdleBlock:^{
		completionHandler();
	}];
}

- (void)beginDelayingTimePickerEvents
{
	dispatch_async(dispatch_get_main_queue(), ^{
		[UIDatePicker dtx_beginDelayingTimePickerEvents];
	});
}

- (void)endDelayingTimePickerEventsWithCompletionHandler:(dispatch_block_t)completionHandler
{
	dispatch_async(dispatch_get_main_queue(), ^{
		[UIDatePicker dtx_endDelayingTimePickerEventsWithCompletionHandler:completionHandler];
	});
}

- (void)handlePerformanceRecording:(NSDictionary*)props isFromLaunch:(BOOL)launch completionHandler:(dispatch_block_t)_completionHandler
{
	__block dispatch_block_t completionHandler = _completionHandler;
	
	dispatch_sync(_recordingManagerQueue, ^{
		if(completionHandler == nil)
		{
			completionHandler = ^ {};
		}
		
		BOOL completionBlocked = NO;
		
		if(props[@"recordingURL"] != nil)
		{
			NSURL* absoluteURL = [NSURL fileURLWithPath:props[@"recordingPath"]];
			
			static dispatch_once_t onceToken;
			dispatch_once(&onceToken, ^{
				_recordingManager = [DetoxInstrumentsManager new];
			});
			if(launch)
			{
				[_recordingManager continueRecordingAtURL:absoluteURL];
			}
			else
			{
				[_recordingManager startRecordingAtURL:absoluteURL];
			}
		}
		else
		{
			completionBlocked = YES;
			[_recordingManager stopRecordingWithCompletionHandler:^(NSError *error) {
				completionHandler();
			}];
		}
		
		if(completionBlocked == NO)
		{
			completionHandler();
		}
	});
}

- (void)stopAndCleanupRecordingWithCompletionHandler:(dispatch_block_t)completionHandler;
{
	[self handlePerformanceRecording:nil isFromLaunch:NO completionHandler:completionHandler];
}

- (void)waitForApplicationState:(UIApplicationState)applicationState completionHandler:(dispatch_block_t)completionHandler
{
	DTXEnsureMainThread(^{
		__block id observer = nil;
		
		void (^response)(void) = ^ {
			completionHandler();
			
			if(observer != nil)
			{
				[NSNotificationCenter.defaultCenter removeObserver:observer];
				observer = nil;
			}
		};
		
		if(UIApplication.sharedApplication.applicationState == applicationState)
		{
			response();
			return;
		}
		
		NSNotificationName notificationName;
		switch (applicationState)
		{
			case UIApplicationStateActive:
				notificationName = UIApplicationDidBecomeActiveNotification;
				break;
			case UIApplicationStateBackground:
				notificationName = UIApplicationDidEnterBackgroundNotification;
				break;
			case UIApplicationStateInactive:
				notificationName = UIApplicationWillResignActiveNotification;
				break;
			default:
				[NSException raise:NSInvalidArgumentException format:@"Inknown application state %@", @(applicationState)];
				break;
		}
		
		observer = [[NSNotificationCenter defaultCenter] addObserverForName:notificationName object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification * _Nonnull note) {
			//Move the response one loop later to ensure all user handlers have been called.
			dispatch_async(dispatch_get_main_queue(), response);
		}];
	});
}

- (void)isDebuggerAttachedWithCompletionHandler:(void(^)(BOOL isDebuggerAttached))completionHandler
{
	completionHandler(DTXIsDebuggerAttached());
}

- (void)reloadReactNativeWithCompletionHandler:(dispatch_block_t)completionHandler
{
	[DTXSyncManager enqueueIdleBlock:^{
		[ReactNativeSupport reloadApp];
		[DTXSyncManager enqueueIdleBlock:completionHandler];
	} queue:dispatch_get_main_queue()];
}

- (void)syncStatusWithCompletionHandler:(void (^)(NSString* information))completionHandler
{
	[DTXSyncManager syncStatusWithCompletionHandler:completionHandler];
}

@end
