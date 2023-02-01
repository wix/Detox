//
//  UIScrollView+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/4/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "UIScrollView+DTXSpy.h"
#import "DTXSingleEventSyncResource.h"

@import ObjectiveC;

static const void* _DTXScrollViewSRKey = &_DTXScrollViewSRKey;

@interface UIScrollView ()

- (void)_scrollViewWillBeginDragging;
- (void)_scrollViewDidEndDraggingWithDeceleration:(_Bool)arg1;
- (void)_scrollViewDidEndDecelerating;

@end

@implementation UIScrollView (DTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		NSError* error;
		
		DTXSwizzleMethod(self, @selector(_scrollViewWillBeginDragging), @selector(__detox_sync__scrollViewWillBeginDragging), &error);
		DTXSwizzleMethod(self, @selector(_scrollViewDidEndDraggingWithDeceleration:), @selector(__detox_sync__scrollViewDidEndDraggingWithDeceleration:), &error);
		DTXSwizzleMethod(self, @selector(_scrollViewDidEndDecelerating), @selector(__detox_sync__scrollViewDidEndDecelerating), &error);
	}
}

- (void)__detox_sync__scrollViewWillBeginDragging
{
	DTXSingleEventSyncResource* sr = [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:self.description eventDescription:@"Scroll View Scroll"];
	objc_setAssociatedObject(self, _DTXScrollViewSRKey, sr, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	
	[self __detox_sync__scrollViewWillBeginDragging];
}

- (void)__detox_sync_resetSyncResource
{
	DTXSingleEventSyncResource* sr = objc_getAssociatedObject(self, _DTXScrollViewSRKey);
	[sr endTracking];
	objc_setAssociatedObject(self, _DTXScrollViewSRKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)__detox_sync__scrollViewDidEndDraggingWithDeceleration:(bool)arg1
{
	[self __detox_sync__scrollViewDidEndDraggingWithDeceleration:arg1];
	
	if(arg1 == NO)
	{
		[self __detox_sync_resetSyncResource];
	}
}

- (void)__detox_sync__scrollViewDidEndDecelerating
{
	[self __detox_sync__scrollViewDidEndDecelerating];
	
	[self __detox_sync_resetSyncResource];
}

@end
