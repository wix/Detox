/*
 *  Copyright (c) 2014-2021 Erik Doernenburg and contributors
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
#import "OCMFunctionsPrivate.h"
#import "OCMInvocationMatcher.h"
#import "OCMock.h"


@interface TestClassForRecorder : NSObject

- (void)methodWithInt:(int)i andObject:(id)o;

- (void)methodWithClass:(Class)class;

@end

@implementation TestClassForRecorder

- (void)methodWithInt:(int)i andObject:(id)o
{
}

- (void)methodWithClass:(Class)class
{
}

@end

@interface OCMInvocationMatcherTests : XCTestCase

@end

@implementation OCMInvocationMatcherTests

- (NSInvocation *)invocationForTargetClass:(Class)aClass selector:(SEL)aSelector
{
    NSMethodSignature *signature = [aClass instanceMethodSignatureForSelector:aSelector];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setSelector:aSelector];
    return invocation;
}

- (void)testMatchesAliasedSelector
{
    OCMInvocationMatcher *matcher = [[OCMInvocationMatcher alloc] init];
    NSInvocation *recordedInvocation = [self invocationForTargetClass:[NSString class] selector:@selector(uppercaseString)];
    [matcher setInvocation:recordedInvocation];

    SEL actual = OCMAliasForOriginalSelector(@selector(uppercaseString));

    XCTAssertTrue([matcher matchesSelector:actual], @"Should have matched.");
}

- (void)testOnlyMatchesInvocationWithRightArguments
{
    NSString *recorded = @"recorded";
    NSString *actual = @"actual";

    OCMInvocationMatcher *matcher = [[OCMInvocationMatcher alloc] init];
    NSInvocation *recordedInvocation = [self invocationForTargetClass:[NSString class] selector:@selector(initWithString:)];
    [recordedInvocation setArgument:&recorded atIndex:2];
    [matcher setInvocation:recordedInvocation];

    NSInvocation *testInvocation = [self invocationForTargetClass:[NSString class] selector:@selector(initWithString:)];
    [testInvocation setArgument:&actual atIndex:2];
    XCTAssertFalse([matcher matchesInvocation:testInvocation], @"Should not match.");
}

- (void)testSelectivelyIgnoresNonObjectArguments
{
    id any = [OCMArg any];
    NSUInteger zero = 0;
    NSString *arg1 = @"I (.*) mocks.";
    NSUInteger arg2 = NSRegularExpressionSearch;

    OCMInvocationMatcher *matcher = [[OCMInvocationMatcher alloc] init];
    NSInvocation *recordedInvocation = [self invocationForTargetClass:[NSString class] selector:@selector(rangeOfString:options:)];
    [recordedInvocation setArgument:&any atIndex:2];
    [recordedInvocation setArgument:&zero atIndex:3];
    [matcher setInvocation:recordedInvocation];
    [matcher setIgnoreNonObjectArgs:YES];

    NSInvocation *testInvocation = [self invocationForTargetClass:[NSString class] selector:@selector(rangeOfString:options:)];
    [testInvocation setArgument:&arg1 atIndex:2];
    [testInvocation setArgument:&arg2 atIndex:3];
    XCTAssertTrue([matcher matchesInvocation:testInvocation], @"Should match.");
}

- (void)testSelectivelyIgnoresNonObjectArgumentsAndStillFailsWhenFollowingObjectArgsDontMatch
{
    int arg1 = 17;
    NSString *recorded = @"recorded";
    NSString *actual = @"actual";

    OCMInvocationMatcher *matcher = [[OCMInvocationMatcher alloc] init];
    NSInvocation *recordedInvocation = [self invocationForTargetClass:[TestClassForRecorder class] selector:@selector(methodWithInt:andObject:)];
    [recordedInvocation setArgument:&arg1 atIndex:2];
    [recordedInvocation setArgument:&recorded atIndex:3];
    [matcher setInvocation:recordedInvocation];
    [matcher setIgnoreNonObjectArgs:YES];

    NSInvocation *testInvocation = [self invocationForTargetClass:[TestClassForRecorder class] selector:@selector(methodWithInt:andObject:)];
    [testInvocation setArgument:&arg1 atIndex:2];
    [testInvocation setArgument:&actual atIndex:3];
    XCTAssertFalse([matcher matchesInvocation:testInvocation], @"Should not match.");
}

- (void)testMatchesInvocationWithClassObjectArgument
{
    Class arg1 = NSObject.class;

    OCMInvocationMatcher *matcher = [[OCMInvocationMatcher alloc] init];
    NSInvocation *recordedInvocation = [self invocationForTargetClass:[TestClassForRecorder class] selector:@selector(methodWithClass:)];
    [recordedInvocation setArgument:&arg1 atIndex:2];
    [matcher setInvocation:recordedInvocation];

    NSInvocation *testInvocation = [self invocationForTargetClass:[TestClassForRecorder class] selector:@selector(methodWithClass:)];
    [testInvocation setArgument:&arg1 atIndex:2];
    XCTAssertTrue([matcher matchesInvocation:testInvocation], @"Should match.");
}

@end
