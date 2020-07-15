//
//  DetoxInit.m
//  Detox
//
//  Created by Leo Natan (Wix) on 5/22/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Detox/Detox-Swift.h>
#import "DetoxCrashHandler.h"

__attribute__((constructor))
static void detoxConditionalInit()
{
	__DTXInstallCrashHandlersIfNeeded();
	
	//This forces accessibility support in the application.
	[[[NSUserDefaults alloc] initWithSuiteName:@"com.apple.Accessibility"] setBool:YES forKey:@"ApplicationAccessibilityEnabled"];
	
	NSUserDefaults* options = [NSUserDefaults standardUserDefaults];
	
	NSMutableDictionary* settings = [NSMutableDictionary new];
	
	NSString* syncEnabled = [options objectForKey:@"detoxEnableSynchronization"];
	if(syncEnabled)
	{
		settings[@"enabled"] = @([syncEnabled boolValue]);
	}
	
	NSArray *blacklistRegex = [options arrayForKey:@"detoxURLBlacklistRegex"];
	if (blacklistRegex)
	{
		settings[@"blacklistURLs"] = blacklistRegex;
	}
	
	NSNumber* maxTimerWait = [options objectForKey:@"detoxMaxSynchronizedDelay"];
	settings[@"maxTimerWait"] = @(maxTimerWait ? maxTimerWait.unsignedIntegerValue : 1500);
	
	NSNumber* waitForDebugger = [options objectForKey:@"detoxWaitForDebugger"];
	if(waitForDebugger)
	{
		settings[@"waitForDebugger"] = @([waitForDebugger unsignedIntegerValue]);
	}
	
	[DTXDetoxManager.sharedManager startWithSynchronizationSettings:settings];
}

