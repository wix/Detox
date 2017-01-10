//
//  TestFailureHandler.m
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "TestFailureHandler.h"

@implementation TestFailureHandler

- (void)handleException:(GREYFrameworkException *)exception details:(NSString *)details
{
    NSString *description = [NSString stringWithFormat:@"%@\n%@", [exception description], details];
    
    NSLog(@"☣️ DETOX:: Test Failed:\n%@", description);
    
    UIWindow* window = [[UIApplication sharedApplication] keyWindow];
    NSLog(@"☣️ DETOX:: UI Hierarchy on test failure:\n%@", [GREYElementHierarchy hierarchyStringForElement:window]);
    
    if (self.delegate) [self.delegate onTestFailed:description];
}

- (void)setInvocationFile:(NSString *)fileName andInvocationLine:(NSUInteger)lineNumber
{
}

@end
