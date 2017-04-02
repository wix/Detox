//
//  SetPhotosPermissionOperation.m
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 29/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "SetPhotosPermissionOperation.h"
#import "JPSimulatorHacks.h"

@implementation SetPhotosPermissionOperation

- (void)executeAsyncWithCompletionHandler:(void (^)(void))handler
{
	[JPSimulatorHacks setPhotosEnabled:[self.permissionStatus boolValue] forBundleIdentifier:self.bundleIdentifier];
	
	handler();
}

@end
