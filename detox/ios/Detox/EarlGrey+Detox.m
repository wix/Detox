//
//  EarlGrey+Detox.m
//  Detox
//
//  Created by Rotem Mizrachi Meidan on 05/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "EarlGrey+Detox.h"
#import "GREYMatchers+Detox.h"

@implementation EarlGreyImpl (Detox)

- (void)detox_safeExecuteSync:(void(^)(void))block
{
	grey_execute_async(^{
		[[GREYUIThreadExecutor sharedInstance] executeSync:^{
			block();
		} error:NULL];
	});
}

- (GREYElementInteraction *)detox_selectElementWithMatcher:(id<GREYMatcher>)elementMatcher
{
    return [self selectElementWithMatcher:[GREYMatchers detoxMatcherAvoidingProblematicReactNativeElements:elementMatcher]];
}

@end
