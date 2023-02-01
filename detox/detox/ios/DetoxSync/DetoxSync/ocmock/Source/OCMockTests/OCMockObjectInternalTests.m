/*
 *  Copyright (c) 2019-2021 Erik Doernenburg and contributors
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
#import "OCMock.h"


#pragma mark Helper classes

@interface TestClassForInternalTests : NSObject

@property(nonatomic, copy) NSString *title;

- (void)doStuffWithClass:(Class)aClass;

@end

@implementation TestClassForInternalTests

@synthesize title;

- (void)doStuffWithClass:(Class)aClass
{
    // stubbed out anyway
}

@end


@interface OCMockObjectInternalTests : XCTestCase

@end

@implementation OCMockObjectInternalTests

#pragma mark Tests

- (void)testReRaisesFailFastExceptionsOnVerify
{
    id mock = [OCMockObject mockForClass:[NSString class]];
    @try
    {
        [mock lowercaseString];
    }
    @catch(NSException *exception)
    {
        // expected
    }
    XCTAssertThrows([mock verify], @"Should have reraised the exception.");
}


- (void)testDoesNotReRaiseStubbedExceptions
{
    id mock = [OCMockObject mockForClass:[NSString class]];
    [[[mock expect] andThrow:[NSException exceptionWithName:@"ExceptionForTest" reason:@"test" userInfo:nil]] lowercaseString];
    @try
    {
        [mock lowercaseString];
    }
    @catch(NSException *exception)
    {
        // expected
    }
    XCTAssertNoThrow([mock verify], @"Should not have reraised stubbed exception.");
}

- (void)testAndThrowDoesntLeak
{
    __weak NSException *exception = nil;
    @autoreleasepool
    {
        id mock = [OCMockObject partialMockForObject:[NSProcessInfo processInfo]];
        exception = [NSException exceptionWithName:NSGenericException
                                            reason:nil
                                          userInfo:nil];
        [[[mock expect] andThrow:exception] arguments];

        BOOL threw = NO;
        @try
        {
            [[NSProcessInfo processInfo] arguments];
        }
        @catch(NSException *ex)
        {
            threw = YES;
        }
        XCTAssertTrue(threw);
        [mock verify];
        [mock stopMocking];
        mock = nil;
    }

    XCTAssertNil(exception, @"The exception should have been released by now");
}

- (void)testReRaisesRejectExceptionsOnVerify
{
    id mock = [OCMockObject niceMockForClass:[NSString class]];
    [[mock reject] uppercaseString];
    @try
    {
        [mock uppercaseString];
    }
    @catch(NSException *exception)
    {
        // expected
    }
    XCTAssertThrows([mock verify], @"Should have reraised the exception.");
}


- (void)testCanCreateExpectationsAfterInvocations
{
    id mock = [OCMockObject mockForClass:[NSString class]];
    [[mock expect] lowercaseString];
    [mock lowercaseString];
    [mock expect];
}


- (void)testArgumentConstraintsAreOnlyCalledAsOftenAsTheMethodIsCalled
{
    __block int count = 0;

    id mock = [OCMockObject mockForClass:[NSString class]];
    [[mock stub] hasSuffix:[OCMArg checkWithBlock:^(id value) {
        count++;
        return YES;
    }]];

    [mock hasSuffix:@"foo"];
    [mock hasSuffix:@"bar"];

    XCTAssertEqual(2, count, @"Should have evaluated constraint only twice");
}


- (void)testVerifyWithDelayDoesNotWaitForRejects
{
    id mock = [OCMockObject niceMockForClass:[NSString class]];

    [[mock reject] hasSuffix:OCMOCK_ANY];
    [[mock expect] hasPrefix:OCMOCK_ANY];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.01 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [mock hasPrefix:@"foo"];
    });

    NSDate *start = [NSDate date];
    [mock verifyWithDelay:4];
    NSDate *end = [NSDate date];

    XCTAssertTrue([end timeIntervalSinceDate:start] < 3, @"Should have returned before delay was up");
}


- (void)testDoesNotReinitialiseMockWhenInitIsCalledMoreThanOnce
{
    id mock = OCMClassMock([TestClassForInternalTests class]);
    OCMStub([mock alloc]).andReturn(mock);
    OCMStub([mock title]).andReturn(@"foo");

    TestClassForInternalTests *object = [[TestClassForInternalTests alloc] init];
    XCTAssertEqualObjects(@"foo", object.title);
}


- (void)testClassArgsAreRetained
{

    id mockWithClassMethod = OCMClassMock([TestClassForInternalTests class]);
    @autoreleasepool
    {
        [[mockWithClassMethod stub] doStuffWithClass:[OCMArg any]];
    }
    XCTAssertNoThrow([mockWithClassMethod doStuffWithClass:[NSString class]]);
}


- (void)testArgumentsGetReleasedAfterStopMocking
{
    __weak id weakArgument;
    id mock = OCMClassMock([TestClassForInternalTests class]);
    @autoreleasepool
    {
        NSMutableString *title = [NSMutableString new];
        weakArgument = title;
        [mock setTitle:title];
        [mock stopMocking];
    }
    XCTAssertNil(weakArgument);
}

- (void)testRaisesWhenAttemptingToVerifyInvocationsAfterStopMocking
{
    id mock = OCMClassMock([TestClassForInternalTests class]);

    [mock title];
    [mock stopMocking];

    @try
    {
        [[mock verify] title];
        XCTFail(@"Should have thrown an NSInternalInconsistencyException when attempting to verify after stopMocking.");
    }
    @catch(NSException *ex)
    {
        XCTAssertEqualObjects(ex.name, NSInternalInconsistencyException);
        XCTAssertTrue([ex.reason containsString:[mock description]]);
    }
}

- (void)testRaisesWhenAttemptingToUseAfterStopMocking
{
    id mock = OCMClassMock([TestClassForInternalTests class]);

    [mock stopMocking];

    @try
    {
        [mock title];
        XCTFail(@"Should have thrown an NSInternalInconsistencyException when attempting to use after stopMocking.");
    }
    @catch(NSException *ex)
    {
        XCTAssertEqualObjects(ex.name, NSInternalInconsistencyException);
        XCTAssertTrue([ex.reason containsString:[mock description]]);
    }
}


@end
