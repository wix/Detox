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

- (void)testRunnerOnTestFailed:(NSString*)details withMessageId:(NSNumber*)messageId;
- (void)testRunnerOnInvokeResult:(id)res withMessageId:(NSNumber*)messageId;
- (void)testRunnerOnError:(NSString*)error withMessageId:(NSNumber*)messageId;

@end

@interface TestRunner : NSObject<TestFailureHandlerDelegate>

@property (nonatomic, assign) id<TestRunnerDelegate> delegate;

- (void) invoke:(NSDictionary*)params withMessageId:(NSNumber*) messageId;
- (void) cleanup;

@end
