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
	
	id blacklistRegex = [options objectForKey:@"detoxURLBlacklistRegex"];
	if (blacklistRegex)
	{
		NSPredicate* predicate = [NSPredicate predicateWithBlock:^BOOL(id value, NSDictionary* __unused bindings) {
			return [value isKindOfClass:NSString.class] && [value length] > 1;
		}];
		NSArray* parsedBlacklist = nil;

		if([blacklistRegex isKindOfClass:NSArray.class])
		{
			parsedBlacklist = [blacklistRegex filteredArrayUsingPredicate:predicate];
		}
		else if([blacklistRegex isKindOfClass:NSString.class])
		{
			NSData* jsonData = [blacklistRegex dataUsingEncoding:NSUTF8StringEncoding];
			NSError* jsonError = nil;
			id jsonParsed = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&jsonError];
			if(!jsonError && [jsonParsed isKindOfClass:NSArray.class])
			{
				parsedBlacklist = [jsonParsed filteredArrayUsingPredicate:predicate];
			}
			else
			{
				NSCharacterSet* separatorOrUselessChars = [NSCharacterSet characterSetWithCharactersInString:@"()\", "];
				NSArray* blacklistArray = [blacklistRegex componentsSeparatedByCharactersInSet:separatorOrUselessChars];
				parsedBlacklist = [blacklistArray filteredArrayUsingPredicate:predicate];
			}
		}
		else
		{
			NSLog(@"[DetoxInit] Ignoring unsupported detoxURLBlacklistRegex value type: %@", [blacklistRegex class]);
		}

		if(parsedBlacklist)
		{
			settings[@"blacklistURLs"] = parsedBlacklist;
		}
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
