//
//  DetoxInit.m
//  Detox
//
//  Created by Leo Natan (Wix) on 5/22/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Detox/Detox-Swift.h>
#import "DetoxCrashHandler.h"

#if DEBUG
@import DetoxSync;

@interface DetoxSyncDebugger : NSObject <DTXSyncManagerDelegate> @end

@implementation DetoxSyncDebugger

- (void)syncSystemDidBecomeIdle
{
	NSLog(@"🟢 System idle");
}

- (void)syncSystemDidBecomeBusy
{
	NSLog(@"🔴 System busy");
}

- (void)syncSystemDidStartTrackingEventWithIdentifier:(NSString*)identifier description:(NSString*)description objectDescription:(nullable NSString*)objectDescription additionalDescription:(nullable NSString*)additionalDescription
{
	NSLog(@"❗️ tracking %@ description: %@ object: %@ additional: %@", identifier, description, objectDescription, additionalDescription);
}

- (void)syncSystemDidEndTrackingEventWithIdentifier:(NSString*)identifier
{
	NSLog(@"❗️ finished tracking %@", identifier);
}
@end

static DetoxSyncDebugger* _detoxSyncDebugger;

#endif

__attribute__((constructor))
static void detoxConditionalInit(void)
{
	__DTXInstallCrashHandlersIfNeeded();
	
	//This forces accessibility support in the application.
	[[[NSUserDefaults alloc] initWithSuiteName:@"com.apple.Accessibility"] setBool:YES forKey:@"ApplicationAccessibilityEnabled"];
	
	NSUserDefaults* options = [NSUserDefaults standardUserDefaults];
	
#if DEBUG
	if([options boolForKey:@"detoxEnableSyncDebug"])
	{
		_detoxSyncDebugger = [DetoxSyncDebugger new];
		DTXSyncManager.delegate = _detoxSyncDebugger;
	}
#endif
	
	NSMutableDictionary* settings = [NSMutableDictionary new];
	
	NSString* syncEnabled = [options objectForKey:@"detoxEnableSynchronization"];
	if(syncEnabled)
	{
		settings[@"enabled"] = @([syncEnabled boolValue]);
	}
	
	NSString *blacklistRegex = [options stringForKey:@"detoxURLBlacklistRegex"];
	if (blacklistRegex)
	{
	    NSCharacterSet* separatorOrUselessChars = [NSCharacterSet characterSetWithCharactersInString:@"()\", "];
        NSArray* _blacklistArray = [blacklistRegex componentsSeparatedByCharactersInSet:separatorOrUselessChars];

        NSPredicate* predicate = [NSPredicate predicateWithFormat:@"length>1"];
        settings[@"blacklistURLs"] = [_blacklistArray filteredArrayUsingPredicate:predicate];
	}
	
	NSString* maxTimerWait = [options objectForKey:@"detoxMaxSynchronizedDelay"];
	settings[@"maxTimerWait"] = @(maxTimerWait ? maxTimerWait.integerValue : 1500);
	
	NSString* waitForDebugger = [options objectForKey:@"detoxWaitForDebugger"];
	if(waitForDebugger)
	{
		settings[@"waitForDebugger"] = @([waitForDebugger integerValue]);
	}
	
	[DTXDetoxManager.sharedManager startWithSynchronizationSettings:settings];
}
