//
//  TestRunner.h
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TestFailureHandler.h"

@protocol TestRunnerDelegate <NSObject>

- (void)testRunnerOnTestFailed:(NSString*)details;
- (void)testRunnerOnInvokeResult:(id)res withInvocationId:(NSString*)invocationId;
- (void)testRunnerOnError:(NSString*)error;

@end

@interface TestRunner : NSObject<TestFailureHandlerDelegate>

@property (nonatomic, assign) id<TestRunnerDelegate> delegate;

- (void) invoke:(NSDictionary*)params;
- (void) cleanup;

@end
