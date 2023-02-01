//
//  NSRunLoop+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/14/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "NSRunLoop+DTXSpy.h"
#import "DTXSyncManager-Private.h"
#import "DTXSingleEventSyncResource.h"
#import "DTXRunLoopSyncResource-Private.h"
#import "fishhook.h"

static void (*__orig_CFRunLoopPerformBlock)(CFRunLoopRef rl, CFTypeRef mode, void(^block)(void));
static void __detox_sync_CFRunLoopPerformBlock(CFRunLoopRef rl, CFTypeRef mode, void(^block)(void))
{
	[[DTXRunLoopSyncResource _existingSyncResourceWithRunLoop:rl clear:NO] _setBusy:YES];
	
	if([DTXSyncManager isRunLoopTracked:rl] == NO)
	{
		__orig_CFRunLoopPerformBlock(rl, mode, block);
		return;
	}
	
	id<DTXSingleEvent> sr = [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:_DTXCFRunLoopDescription(rl, nil) eventDescription:@"Runloop Perform Block"];
	
	__orig_CFRunLoopPerformBlock(rl, mode, ^ {
		block();
		
		[sr endTracking];
	});
}

static void (*__orig_CFRunLoopWakeUp)(CFRunLoopRef rl);
static void __detox_sync_CFRunLoopWakeUp(CFRunLoopRef rl)
{
	[[DTXRunLoopSyncResource _existingSyncResourceWithRunLoop:rl clear:NO] _setBusy:YES];
	
	__orig_CFRunLoopWakeUp(rl);
}

@implementation NSRunLoop (DTXSpy)

+ (void)load
{
	struct rebinding r[] = (struct rebinding[]) {
		"CFRunLoopPerformBlock", __detox_sync_CFRunLoopPerformBlock, (void*)&__orig_CFRunLoopPerformBlock,
		"CFRunLoopWakeUp", __detox_sync_CFRunLoopWakeUp, (void*)&__orig_CFRunLoopWakeUp,
	};
	rebind_symbols(r, sizeof(r) / sizeof(struct rebinding));
}

@end
