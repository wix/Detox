//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import "UIApplication+DTXAdditions.h"

@import ObjectiveC;
@import Darwin;

#import "DTXAppleInternals.h"

/**
 *  List for all the runloop modes that have been pushed and unpopped using UIApplication's push/pop
 *  runloop mode methods. The most recently pushed runloop mode is at the end of the list.
 */
static NSMutableArray *gRunLoopModes;

@implementation UIApplication (DTXAdditions)

+ (void)load {
	@autoreleasepool {
		gRunLoopModes = [[NSMutableArray alloc] init];
		
		[NSNotificationCenter.defaultCenter addObserverForName:@"_UIApplicationRunLoopModePushNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
			[gRunLoopModes addObject:note.userInfo[@"_UIApplicationRunLoopMode"]];
		}];
		
		[NSNotificationCenter.defaultCenter addObserverForName:@"_UIApplicationRunLoopModePopNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
			NSCParameterAssert([gRunLoopModes.lastObject isEqualToString:note.userInfo[@"_UIApplicationRunLoopMode"]]);
			[gRunLoopModes removeLastObject];
		}];
	}
}

- (NSString *)dtx_activeRunLoopMode {
	@synchronized(gRunLoopModes) {
		// could be nil.
		return [gRunLoopModes lastObject];
	}
}

+ (void)dtx_enableAccessibilityForSimulator
{
	NSLog(@"Enabling accessibility for automation on Simulator.");
	static NSString *path =
	@"/System/Library/PrivateFrameworks/AccessibilityUtilities.framework/AccessibilityUtilities";
	char const *const localPath = [path fileSystemRepresentation];
	
	dlopen(localPath, RTLD_LOCAL);
	
	Class AXBackBoardServerClass = NSClassFromString(@"AXBackBoardServer");
	id server = [AXBackBoardServerClass server];
	
	[server setAccessibilityPreferenceAsMobile:(CFStringRef)@"ApplicationAccessibilityEnabled"
										 value:kCFBooleanTrue
								  notification:(CFStringRef)@"com.apple.accessibility.cache.app.ax"];
	[server setAccessibilityPreferenceAsMobile:(CFStringRef)@"AccessibilityEnabled"
										 value:kCFBooleanTrue
								  notification:(CFStringRef)@"com.apple.accessibility.cache.ax"];
}


@end
