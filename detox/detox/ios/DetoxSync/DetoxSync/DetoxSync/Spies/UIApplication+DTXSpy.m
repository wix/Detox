//
//  UIApplication+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/4/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "UIApplication+DTXSpy.h"
#import "DTXSingleEventSyncResource.h"

@import ObjectiveC;

static const void* _DTXApplicationIgnoringEventsSRKey = &_DTXApplicationIgnoringEventsSRKey;

@implementation UIApplication (DTXSpy)

+ (void)load
{
	@autoreleasepool {
		NSError* error;
		
		DTXSwizzleMethod(self, @selector(beginIgnoringInteractionEvents), @selector(__detox_sync_beginIgnoringInteractionEvents), &error);
		DTXSwizzleMethod(self, @selector(endIgnoringInteractionEvents), @selector(__detox_sync_endIgnoringInteractionEvents), &error);
	}
}

- (void)__detox_sync_resetSyncResource
{
	DTXSingleEventSyncResource* sr = objc_getAssociatedObject(self, _DTXApplicationIgnoringEventsSRKey);
	[sr endTracking];
	objc_setAssociatedObject(self, _DTXApplicationIgnoringEventsSRKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

CLANG_IGNORE(-Wdeprecated-declarations)
- (void)__detox_sync_beginIgnoringInteractionEvents
{
	BOOL wasIgnoring = self.isIgnoringInteractionEvents;
	
	[self __detox_sync_beginIgnoringInteractionEvents];
	
	if(wasIgnoring == NO)
	{
		DTXSingleEventSyncResource* sr = [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:self.description eventDescription:@"Application Ignoring Interaction Events"];
		objc_setAssociatedObject(self, _DTXApplicationIgnoringEventsSRKey, sr, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	}
}

- (void)__detox_sync_endIgnoringInteractionEvents
{
	[self __detox_sync_endIgnoringInteractionEvents];
	
	if(self.isIgnoringInteractionEvents == NO)
	{
		[self __detox_sync_resetSyncResource];
	}
}
CLANG_POP

@end
