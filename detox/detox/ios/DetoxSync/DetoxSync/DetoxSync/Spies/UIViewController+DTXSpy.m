//
//  UIViewController+DTXSpy.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "UIViewController+DTXSpy.h"
#import "DTXSingleEventSyncResource.h"
#import "DTXUISyncResource.h"

@import ObjectiveC;

@implementation UIViewController (DTXSpy)

+ (void)load
{
	@autoreleasepool
	{
		NSError* error;
		
		DTXSwizzleMethod(self, @selector(viewWillAppear:), @selector(__detox_sync__viewWillAppear:), &error);
		DTXSwizzleMethod(self, @selector(viewWillDisappear:), @selector(__detox_sync__viewWillDisappear:), &error);
	}
}

- (void)__detox_sync__viewWillAppear:(BOOL)animated
{
	[DTXUISyncResource.sharedInstance trackViewControllerWillAppear:self];
	
	[self __detox_sync__viewWillAppear:animated];
}

- (void)__detox_sync__viewDidAppear:(BOOL)animated
{
	[self __detox_sync__viewDidAppear:animated];
}

- (void)__detox_sync__viewWillDisappear:(BOOL)animated
{
	[DTXUISyncResource.sharedInstance trackViewControllerWillDisappear:self];
	
	[self __detox_sync__viewWillDisappear:animated];
}

- (void)__detox_sync__viewDidDisappear:(BOOL)animated
{
	[self __detox_sync__viewDidDisappear:animated];
}

@end
