//
//  WXRunLoopIdlingResource.m
//  Detox
//
//  Created by Leo Natan (Wix) on 14/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "WXRunLoopIdlingResource.h"

@implementation WXRunLoopIdlingResource
{
	id _runLoop;
	dispatch_queue_t _syncSerialQueue;
	BOOL _isBusy;
}

- (NSString*)translateRunLoopActivity:(CFRunLoopActivity)act
{
    switch (act) {
        case kCFRunLoopEntry:
            return @"kCFRunLoopEntry";
        case kCFRunLoopExit:
            return @"kCFRunLoopExit";
        case kCFRunLoopBeforeTimers:
            return @"kCFRunLoopBeforeTimers";
        case kCFRunLoopBeforeSources:
            return @"kCFRunLoopBeforeSources";
        case kCFRunLoopAfterWaiting:
            return @"kCFRunLoopAfterWaiting";
        case kCFRunLoopBeforeWaiting:
            return @"kCFRunLoopBeforeWaiting";
        default:
            return @"----";
    }
}

- (instancetype)initWithRunLoop:(CFRunLoopRef)runLoop
{
	self = [super init];
	if(self)
	{
		_runLoop = (__bridge id)(runLoop);
		_syncSerialQueue = dispatch_queue_create("_syncSerialQueue", NULL);
		
		CFRunLoopAddObserver((__bridge CFRunLoopRef)_runLoop, CFRunLoopObserverCreateWithHandler(NULL, kCFRunLoopExit | kCFRunLoopBeforeWaiting | kCFRunLoopAfterWaiting, YES, 0, ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
			dispatch_sync(_syncSerialQueue, ^{
//				NSLog(@"☣️ DETOX:: Current runloop activity: %@", [self translateRunLoopActivity: activity]);
				if(activity == kCFRunLoopBeforeWaiting || activity == kCFRunLoopExit)
				{
					_isBusy = NO;
				}
				else
				{
					_isBusy = YES;
				}
			});
		}), kCFRunLoopDefaultMode);
	}
	return self;
}

- (BOOL)isIdleNow
{
	__block BOOL rv = NO;
	
	dispatch_sync(_syncSerialQueue, ^{
		rv = _isBusy == NO;
	});
    
	return rv;
}

- (NSString *)idlingResourceName
{
	return NSStringFromClass([self class]);
}

- (NSString *)idlingResourceDescription
{
	return [self idlingResourceName];
}

@end
