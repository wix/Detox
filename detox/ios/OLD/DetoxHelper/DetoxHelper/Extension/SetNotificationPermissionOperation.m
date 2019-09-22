//
//  SetNotificationPermissionOperation.m
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 29/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "SetNotificationPermissionOperation.h"

@implementation SetNotificationPermissionOperation

+ (NSURL *)_libraryURL
{
	static NSURL *result;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		NSURL *url = [[NSBundle mainBundle].bundleURL URLByAppendingPathComponent:@".."];
		do {
			url = [[url URLByAppendingPathComponent:@".."] URLByStandardizingPath];
			NSURL *libraryURL = [url URLByAppendingPathComponent:@"Library"];
			BOOL isDirectory;
			if ([[NSFileManager defaultManager] fileExistsAtPath:libraryURL.path isDirectory:&isDirectory] && isDirectory) {
				url = libraryURL;
				break;
			}
		} while (![url.path isEqualToString:@"/"]);
		result = url;
	});
	return result;
}

- (void)_setNotificationsEnabled:(BOOL)enabled forBundleIdentifier:(NSString*)bundleIdentifier displayName:(NSString*)displayName completionHandler:(void(^)(NSError* error))handler
{
	NSBundle* foundationBundle = [NSBundle bundleForClass:[NSExtensionContext class]];
	
	NSBundle* bundle = nil;
	Class cls = NSClassFromString(@"BBSectionInfo");
	if(cls == nil)
	{
		bundle = [NSBundle bundleWithURL:[[foundationBundle.bundleURL URLByAppendingPathComponent:@"../../PrivateFrameworks/BulletinBoard.framework"] URLByStandardizingPath]];
		[bundle load];
	}
	else
	{
		bundle = [NSBundle bundleForClass:cls];
	}
	cls = [bundle classNamed:@"BBSectionInfo"];
	
	id obj = [cls new];
	[obj setValue:@NO forKey:@"suppressFromSettings"];
	[obj setValue:@0 forKey:@"suppressedSettings"];
	[obj setValue:@NO forKey:@"displaysCriticalBulletins"];
	[obj setValue:@0 forKey:@"sectionCategory"];
	[obj setValue:@0 forKey:@"subsectionPriority"];
	[obj setValue:@0 forKey:@"sectionType"];
	[obj setValue:@NO forKey:@"hideWeeApp"];
	
	[obj setValue:bundleIdentifier forKey:@"sectionID"];
	
	cls = [bundle classNamed:@"BBSectionInfoSettings"];
	id settings = [cls new];
	[settings setValue:@63 forKey:@"pushSettings"];
	[settings setValue:@YES forKey:@"showsInNotificationCenter"];
	[settings setValue:@(enabled) forKey:@"allowsNotifications"];
	[settings setValue:@YES forKey:@"showsOnExternalDevices"];
	[settings setValue:@0 forKey:@"contentPreviewSetting"];
	[settings setValue:@1 forKey:@"alertType"];
	[settings setValue:@YES forKey:@"showsInLockScreen"];
	[settings setValue:@NO forKey:@"carPlaySetting"];
	
	[obj setValue:settings forKey:@"sectionInfoSettings"];
	
	[obj setValue:bundleIdentifier forKey:@"sectionID"];
	[obj setValue:displayName forKey:@"appName"];
	[obj setValue:displayName forKey:@"displayName"];
	
//	NSData* sectionInfoData = [NSKeyedArchiver archivedDataWithRootObject:obj];
//	NSMutableDictionary* bulletingSectionInfo = [NSMutableDictionary dictionaryWithContentsOfFile:@"/Users/lnatan/Library/Developer/CoreSimulator/Devices/9446E8CE-9559-4D13-AB75-E7EED7EDA36A/data/Library/BulletinBoard/SectionInfo.plist"];
//	bulletingSectionInfo[@"com.LeoNatan.LNPopupControllerExample-"] = sectionInfoData;
//	[bulletingSectionInfo writeToFile:@"/Users/lnatan/Library/Developer/CoreSimulator/Devices/9446E8CE-9559-4D13-AB75-E7EED7EDA36A/data/Library/BulletinBoard/SectionInfo.plist" atomically:YES];
	
	id gw = [NSClassFromString(@"BBSettingsGateway") new];
	
	NSString* zz = bundleIdentifier;
	
	NSInvocation* inv = [NSInvocation invocationWithMethodSignature:[gw methodSignatureForSelector:@selector(setSectionInfo:forSectionID:withCompletion:)]];
	[inv setTarget:gw];
	[inv setSelector:@selector(setSectionInfo:forSectionID:withCompletion:)];
	[inv setArgument:&obj atIndex:2];
	[inv setArgument:&zz atIndex:3];
	
	[inv retainArguments];
	
	id comp = [handler copy];
	
	[inv setArgument:&comp atIndex:4];
	[inv invoke];
}

- (void)executeAsyncWithCompletionHandler:(void (^)(void))handler
{
	[self _setNotificationsEnabled:[self.permissionStatus boolValue] forBundleIdentifier:self.bundleIdentifier displayName:self.displayName completionHandler:^(NSError *error) {
		if(error)
		{
			NSLog(@"Error: %@", error);
		}
		
		handler();
	}];
}

@end
