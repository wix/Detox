//
//  ExtensionOperation.m
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 29/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "ExtensionOperation.h"

@implementation ExtensionOperation
{
	BOOL _isExecuting, _isFinished;
}

- (void)executeAsyncWithCompletionHandler:(void (^)(void))handler
{
	handler();
}

- (void)start
{
	NSLog(@"%@ - starting", NSStringFromClass(self.class));
	
	[self willChangeValueForKey:@"isExecuting"];
	_isExecuting = YES;
	[self didChangeValueForKey:@"isExecuting"];
	
	[self executeAsyncWithCompletionHandler:^{
		NSLog(@"%@ - ending", NSStringFromClass(self.class));
		[self willChangeValueForKey:@"isExecuting"];
		_isExecuting = NO;
		[self didChangeValueForKey:@"isExecuting"];
		
		[self willChangeValueForKey:@"isFinished"];
		_isFinished = YES;
		[self didChangeValueForKey:@"isFinished"];
	}];
}

- (BOOL)isExecuting
{
	return _isExecuting;
}

- (BOOL)isFinished
{
	return _isFinished;
}


@end
