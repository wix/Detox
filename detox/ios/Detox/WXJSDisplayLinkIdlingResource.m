//
//  WXJSDisplayLinkIdlingResource.m
//  Detox
//
//  Created by Leo Natan (Wix) on 14/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "WXJSDisplayLinkIdlingResource.h"

@implementation WXJSDisplayLinkIdlingResource
{
	CADisplayLink* _displayLink;
}

- (instancetype)initWithDisplayLink:(CADisplayLink *)displayLink
{
	self = [super init];
	if(self)
	{
		_displayLink = displayLink;
	}
	return self;
}

- (BOOL)isIdleNow
{
	NSLog(@"☣️ DETOX:: DisplayLinkIdleResource: %@", @(_displayLink.isPaused));
    
	return _displayLink.isPaused;
}

- (NSString *)idlingResourceName
{
	return NSStringFromClass([self class]);
}

- (NSString *)idlingResourceDescription
{
	return [self idlingResourceName];
}

@end
