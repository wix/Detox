//
//  DetoxManager.m
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

#import "DetoxManager.h"
#import "DetoxIPCAPI.h"
#import <DetoxIPC/DTXIPCConnection.h>
@import ObjectiveC;
@import Darwin;

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
		[self.sharedListener connect];
	}
}

+ (instancetype)sharedListener
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
		_runnerConnection = [[DTXIPCConnection alloc] initWithRegisteredServiceName:serviceName];
		_runnerConnection.exportedInterface = [DTXIPCInterface interfaceWithProtocol:@protocol(DetoxHelper)];
		_runnerConnection.exportedObject = self;
		_runnerConnection.remoteObjectInterface = [DTXIPCInterface interfaceWithProtocol:@protocol(DetoxTestRunner)];
	});
}

- (void)waitForIdleWithCompletionHandler:(dispatch_block_t)completionHandler
{
	completionHandler();
}

- (void)aMoreComplexSelector:(NSUInteger)a b:(NSString*)str c:(void(^)(dispatch_block_t))block1 d:(void(^)(NSArray*))test
{
	if(block1 != nil)
	{
		block1(^ {
			NSLog(@"from inner block");
		});
	}
	
	test(@[@"Hello", @123, @{@"Hi": @"There"}]);
}

@end
