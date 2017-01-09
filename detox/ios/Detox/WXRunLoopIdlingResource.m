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
	CFRunLoopRef _runLoop;
	dispatch_queue_t _dateSerialQueue;
	BOOL _isBusy;
}

/*
typedef CF_OPTIONS(CFOptionFlags, CFRunLoopActivity) {
    kCFRunLoopEntry = (1UL << 0),
    kCFRunLoopBeforeTimers = (1UL << 1),
    kCFRunLoopBeforeSources = (1UL << 2),
    kCFRunLoopBeforeWaiting = (1UL << 5),
    kCFRunLoopAfterWaiting = (1UL << 6),
    kCFRunLoopExit = (1UL << 7),
    kCFRunLoopAllActivities = 0x0FFFFFFFU
};
 */


- (NSString*)translate:(CFRunLoopActivity)act
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
		_runLoop = runLoop;
		_dateSerialQueue = dispatch_queue_create("_dateSerialQueue", NULL);
		
		CFRunLoopAddObserver(_runLoop, CFRunLoopObserverCreateWithHandler(NULL, kCFRunLoopAllActivities | kCFRunLoopExit| kCFRunLoopBeforeWaiting | kCFRunLoopAfterWaiting, YES, 0, ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
			dispatch_sync(_dateSerialQueue, ^{
                
                NSLog(@"------- %@", [self translate:activity]);
                
//                _isBusy = !(activity == kCFRunLoopBeforeWaiting || activity == kCFRunLoopExit);
                
                
				if(activity == kCFRunLoopBeforeWaiting)
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
	
	dispatch_sync(_dateSerialQueue, ^{
		rv = _isBusy == NO;
	});
    
    NSLog(@"RL:%@", @(rv));
	
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
