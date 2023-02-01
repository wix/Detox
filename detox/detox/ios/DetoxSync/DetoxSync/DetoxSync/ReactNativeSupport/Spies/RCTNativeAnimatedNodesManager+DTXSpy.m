//
//  RCTNativeAnimatedNodesManager+DTXSpy.c
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/14/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "RCTNativeAnimatedNodesManager+DTXSpy.h"
#import "DTXSyncManager-Private.h"

@import ObjectiveC;

@interface NSObject ()

- (void)startAnimationLoopIfNeeded;
- (void)stopAnimationLoop;

@end

@implementation NSObject (RCTNativeAnimatedNodesManagerDTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		Class cls = NSClassFromString(@"RCTNativeAnimatedNodesManager");
		
		if(cls == nil)
		{
			return;
		}
		
		NSError* error;
		
		DTXSwizzleMethod(cls, @selector(startAnimationLoopIfNeeded), @selector(__detox_sync_startAnimationLoopIfNeeded), &error);
		DTXSwizzleMethod(cls, @selector(stopAnimationLoop), @selector(__detox_sync_stopAnimationLoop), &error);
	}
}

- (void)__detox_sync_startAnimationLoopIfNeeded
{
	[self __detox_sync_startAnimationLoopIfNeeded];
	
	[DTXSyncManager trackDisplayLink:[self valueForKey:@"displayLink"] name:@"React Native Animations Display Link"];
}

- (void)__detox_sync_stopAnimationLoop
{
	CADisplayLink* dl = [self valueForKey:@"displayLink"];
	[self __detox_sync_stopAnimationLoop];

	if(dl != nil)
	{
		[DTXSyncManager untrackDisplayLink:dl];
	}
}

@end
