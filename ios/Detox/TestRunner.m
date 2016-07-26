//
//  TestRunner.m
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "TestRunner.h"
#import "MethodInvocation.h"
#import "TestFailureHandler.h"

@interface TestRunner()

@property (nonatomic, retain) TestFailureHandler *failureHandler;

@end


@implementation TestRunner

- (void) initEarlGrey
{
    [EarlGrey setFailureHandler:self.failureHandler];
    [[GREYConfiguration sharedInstance] setValue:@(NO) forConfigKey:kGREYConfigKeyAnalyticsEnabled];
    //[[GREYConfiguration sharedInstance] setValue:@".*localhost.*" forConfigKey:kGREYConfigKeyURLBlacklistRegex];
}

- (void) cleanupEarlGrey
{
    // this triggers grey_tearDown in GREYAutomationSetup
    [[NSNotificationCenter defaultCenter] postNotificationName:@"GREYXCTestCaseInstanceDidFinish"
                                                        object:self
                                                      userInfo:nil];
}

- (instancetype)init
{
    self = [super init];
    if (self == nil) return nil;
    
    self.failureHandler = [[TestFailureHandler alloc] init];
    self.failureHandler.delegate = self;
    [self initEarlGrey];
    
    return self;
}

- (void) cleanup
{
    [self cleanupEarlGrey];
}

- (void)onTestFailed:(NSString *)details
{
    if (self.delegate) [self.delegate testRunnerOnTestFailed:details];
}

- (void) invoke:(NSDictionary*)params
{
    NSString *invocationId = [params objectForKey:@"id"];
    grey_execute_async(^{
        id res = [MethodInvocation invoke:params onError:^(NSString *error) {
            if (self.delegate) [self.delegate testRunnerOnError:error];
        }];
        if (invocationId != nil)
        {
            if (self.delegate) [self.delegate testRunnerOnInvokeResult:res withInvocationId:invocationId];
        }
    });
}

/*
 
 grey_execute_async(^{
 
 [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Click Me")]
 performAction:grey_tap()];
 
 [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Yay")]
 assertWithMatcher:grey_sufficientlyVisible()];
 
 [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Mitzi")]
 assertWithMatcher:grey_sufficientlyVisible()];
 
 //exit(0);
 
 });
 
*/

@end
