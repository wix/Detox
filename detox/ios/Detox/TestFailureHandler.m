//
//  TestFailureHandler.m
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "TestFailureHandler.h"

DTX_CREATE_LOG(TestFailureHandler)

@implementation TestFailureHandler

- (void)handleException:(GREYFrameworkException *)exception details:(NSString *)details
{
	UIWindow* window = [[UIApplication sharedApplication] keyWindow];
	NSString* hierarchy = [GREYElementHierarchy hierarchyStringForElement:window];
	
	NSString *description = [NSString stringWithFormat:@"%@\n\n%@\n\nHierarchy: %@", [exception description], details, hierarchy];
	
	dtx_log_fault(@"Test Failed:\n%@", description);
	
    dtx_log_error(@"UI Hierarchy on test failure:\n%@", hierarchy);
    
    if (self.delegate) [self.delegate onTestFailed:description];
}

- (void)setInvocationFile:(NSString *)fileName andInvocationLine:(NSUInteger)lineNumber
{
}

@end
