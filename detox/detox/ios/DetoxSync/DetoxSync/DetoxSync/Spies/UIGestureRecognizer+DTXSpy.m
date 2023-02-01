//
//  UIGestureRecognizer+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/4/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "UIGestureRecognizer+DTXSpy.h"
#import "DTXSingleEventSyncResource.h"

@import ObjectiveC;

static const void* _DTXGestureRecognizerSRKey = &_DTXGestureRecognizerSRKey;

@interface UIGestureRecognizer ()

- (void)_setDirty;
- (void)_resetGestureRecognizer;
- (void)setState:(UIGestureRecognizerState)state;

@end

@implementation UIGestureRecognizer (DTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		NSError* error;

		DTXSwizzleMethod(self, @selector(_setDirty), @selector(__detox_sync__setDirty), &error);
		DTXSwizzleMethod(self, @selector(_resetGestureRecognizer), @selector(__detox_sync__resetGestureRecognizer), &error);
		DTXSwizzleMethod(self, @selector(setState:), @selector(__detox_sync_setState:), &error);
	}
}

- (void)__detox_sync__setDirty
{
	if([NSStringFromClass(self.class) hasPrefix:@"SwiftUI."] == NO && self.state != UIGestureRecognizerStateFailed)
	{
		DTXSingleEventSyncResource* sr = [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:self.description eventDescription:@"Gesture Recognizer"];
		objc_setAssociatedObject(self, _DTXGestureRecognizerSRKey, sr, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	}
	
	[self __detox_sync__setDirty];
}

- (void)__detox_sync_resetSyncResource
{
	DTXSingleEventSyncResource* sr = objc_getAssociatedObject(self, _DTXGestureRecognizerSRKey);
	[sr endTracking];
	objc_setAssociatedObject(self, _DTXGestureRecognizerSRKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)__detox_sync__resetGestureRecognizer
{
	[self __detox_sync__resetGestureRecognizer];
	
	[self __detox_sync_resetSyncResource];
}

- (void)__detox_sync_setState:(UIGestureRecognizerState)state
{
	[self __detox_sync_setState:state];
	
	if(state == UIGestureRecognizerStateFailed)
	{
		[self __detox_sync_resetSyncResource];
	}
}

@end
