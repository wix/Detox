/*
 *  Copyright (c) 2004-2021 Erik Doernenburg and contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may
 *  not use these files except in compliance with the License. You may obtain
 *  a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

#import <XCTest/XCTest.h>
#import "OCMExceptionReturnValueProvider.h"
#import "OCMInvocationStub.h"
#import "OCMObjectReturnValueProvider.h"
#import "OCMock.h"


@interface OCMStubRecorderTests : XCTestCase

@end


@implementation OCMStubRecorderTests

- (void)testCreatesInvocationMatcher
{
    NSString *arg = @"I love mocks.";

    id mock = [OCMockObject mockForClass:[NSString class]];
    OCMStubRecorder *recorder = [[OCMStubRecorder alloc] initWithMockObject:mock];
    [(id)recorder stringByAppendingString:arg];

    NSMethodSignature *signature = [NSString instanceMethodSignatureForSelector:@selector(stringByAppendingString:)];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setSelector:@selector(stringByAppendingString:)];
    [invocation setArgument:&arg atIndex:2];
    XCTAssertTrue([[recorder invocationMatcher] matchesInvocation:invocation], @"Should match.");
}

- (void)testAddsReturnValueProvider
{
    id mock = [OCMockObject mockForClass:[NSString class]];
    OCMStubRecorder *recorder = [[OCMStubRecorder alloc] initWithMockObject:mock];
    [recorder andReturn:@"foo"];
    NSArray *actionList = [(OCMInvocationStub *)[recorder invocationMatcher] invocationActions];

    XCTAssertEqual((NSUInteger)1, [actionList count], @"Should have added one action.");
    XCTAssertEqualObjects([OCMObjectReturnValueProvider class], [[actionList objectAtIndex:0] class], @"Should have added correct action.");
}

- (void)testAddsExceptionReturnValueProvider
{
    id mock = [OCMockObject mockForClass:[NSString class]];
    OCMStubRecorder *recorder = [[OCMStubRecorder alloc] initWithMockObject:mock];
    [recorder andThrow:[NSException exceptionWithName:@"TestException" reason:@"A reason" userInfo:nil]];
    NSArray *actionList = [(OCMInvocationStub *)[recorder invocationMatcher] invocationActions];

    XCTAssertEqual((NSUInteger)1, [actionList count], @"Should have added one action.");
    XCTAssertEqualObjects([OCMExceptionReturnValueProvider class], [[actionList objectAtIndex:0] class], @"Should have added correct action.");
}

@end
