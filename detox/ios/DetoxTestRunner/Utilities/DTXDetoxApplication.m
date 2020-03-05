//
//  DTXDetoxApplication.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/22/19.
//

#import "DTXDetoxApplication.h"
#import "DetoxIPCAPI.h"
#import <DetoxIPC/DTXIPCConnection.h>
@import ObjectiveC;

@interface DTXDetoxApplication () <DetoxTestRunner>
{
	DTXIPCConnection* _connection;
	id _remoteObjectProxy;
}

@end

@implementation DTXDetoxApplication

+ (void)load
{
//	Method m1 = class_getInstanceMethod(NSClassFromString(@"XCUIApplicationImpl"), NSSelectorFromString(@"_launchUsingPlatformWithArguments:environment:"));
//	Method m2 = class_getInstanceMethod(NSClassFromString(@"XCUIApplicationImpl"), NSSelectorFromString(@"_launchUsingXcodeWithArguments:environment:"));
//
//	IMP imp2 = method_getImplementation(m2);
//	method_setImplementation(m1, imp2);
	
	Method m = class_getInstanceMethod(NSClassFromString(@"XCUIApplicationRegistryRecord"), NSSelectorFromString(@"isTestDependency"));
	method_setImplementation(m, imp_implementationWithBlock(^ (id _self) {
		return YES;
	}));
	
//	Protocol* p = @protocol(XCUIElementTypeQueryProvider);
//	unsigned int methodsCount;
//	struct objc_method_description* methods = protocol_copyMethodDescriptionList(p, YES, YES, &methodsCount);
//	
//	for(unsigned int idx = 0; idx < methodsCount; idx++)
//	{
//		if(methods[idx].name != NULL)
//		{
//			{
//				m = class_getInstanceMethod(XCUIElementQuery.class, methods[idx].name);
//				id (*orig)(id, SEL) = (void*)method_getImplementation(m);
//				method_setImplementation(m, imp_implementationWithBlock(^ (id _self) {
//					return orig(_self, methods[idx].name);
//				}));
//			}
//			{
//				m = class_getInstanceMethod(XCUIElement.class, methods[idx].name);
//				id (*orig)(id, SEL) = (void*)method_getImplementation(m);
//				method_setImplementation(m, imp_implementationWithBlock(^ (id _self) {
//					return orig(_self, methods[idx].name);
//				}));
//			}
//		}
//	}
//	
//	free(methods);
}

- (void)_commonInit
{
	NSString* bundleIdentifier = [self valueForKey:@"bundleID"];
	_connection = [[DTXIPCConnection alloc] initWithServiceName:[NSString stringWithFormat:@"DetoxTestrunner-%@", bundleIdentifier]];
	_connection.exportedInterface = [DTXIPCInterface interfaceWithProtocol:@protocol(DetoxTestRunner)];
	_connection.exportedObject = self;
	_connection.remoteObjectInterface = [DTXIPCInterface interfaceWithProtocol:@protocol(DetoxHelper)];
	
//	_remoteObjectProxy = _connection.remoteObjectProxy;
}

- (instancetype)initWithBundleIdentifier:(NSString *)bundleIdentifier
{
	self = [super initWithBundleIdentifier:bundleIdentifier];
	
	if(self)
	{
		[self _commonInit];
	}
	
	return self;
}

- (instancetype)init
{
	self = [super init];
	
	if(self)
	{
		[self _commonInit];
	}
	
	return self;
}

- (DTXIPCConnection*)detoxHelperConnection
{
	return _connection;
}

- (id<DetoxHelper>)detoxHelper
{
	return _remoteObjectProxy;
}

- (void)launch
{
	NSMutableDictionary* userEnvironment = self.launchEnvironment.mutableCopy;
	userEnvironment[@"DYLD_INSERT_LIBRARIES"] = [[[NSBundle bundleForClass:self.class] URLForResource:@"DetoxHelper" withExtension:@"framework"] URLByAppendingPathComponent:@"DetoxHelper"].path;
	userEnvironment[@"DetoxRunnerServiceName"] = _connection.serviceName;
//	userEnvironment[@"NSZombieEnabled"] = @"YES";
	self.launchEnvironment = userEnvironment;
	
	[super launch];
	
	[self waitForIdleWithTimeout:0];
}

- (BOOL)waitForIdleWithTimeout:(NSTimeInterval)timeout
{
	if(self.detoxHelper == nil)
	{
		return YES;
	}
	
	dispatch_group_t gr = dispatch_group_create();
	dispatch_group_enter(gr);
	
	__block BOOL cancelledDueToTimeout = NO;
	
	[self.detoxHelper waitForIdleWithCompletionHandler:^{
		if(cancelledDueToTimeout == NO)
		{
			dispatch_group_leave(gr);
		}
	}];
	
	dispatch_time_t waitTime = timeout == 0 ? DISPATCH_TIME_FOREVER : dispatch_time(DISPATCH_TIME_NOW, timeout);
	
	cancelledDueToTimeout = dispatch_group_wait(gr, waitTime) != 0;
	
	return cancelledDueToTimeout != NO;
}

#pragma mark DetoxTestRunner

- (void)notifyOnCrashWithDetails:(NSDictionary*)details
{
	[self.delegate application:self didCrashWithDetails:details];
}

- (void)getLaunchArgumentsWithCompletionHandler:(void (^)(NSUInteger waitForDebugger, NSURL* recordingPath, NSDictionary<NSString*, id>* userNotificationData, NSDictionary<NSString*, id>* userActivityData, NSURL* openURL, NSString* sourceApp))completionHandler
{
	_remoteObjectProxy = [_connection synchronousRemoteObjectProxyWithErrorHandler:^(NSError * _Nonnull error) {
		NSLog(@"%@", error);
	}];
	
	completionHandler(self.launchWaitForDebugger, self.launchRecordingPath, self.launchUserNotification, self.launchUserActivity, self.launchOpenURL, self.launchSourceApp);
}

@end
