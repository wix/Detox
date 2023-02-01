/*
 *  Copyright (c) 2016-2021 Erik Doernenburg and contributors
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


@interface TestClassForQuantifiers : NSObject

- (void)doStuff;

@end

@implementation TestClassForQuantifiers

- (void)doStuff
{
}

@end


@interface OCMQuantifierTests : XCTestCase
{
    BOOL expectFailure;
    BOOL didRecordFailure;
}

@end


@implementation OCMQuantifierTests

- (void)setUp
{
    expectFailure = NO;
}

#if defined(__IPHONE_14_0) && !defined(OCM_DISABLE_XCTEST_FEATURES) // this is actually a test for Xcode 12; see issue #472

- (void)recordIssue:(XCTIssue *)issue
{
    if(expectFailure)
    {
        didRecordFailure = YES;
    }
    else
    {
        [super recordIssue:issue];
    }
}

#else

- (void)recordFailureWithDescription:(NSString *)description inFile:(NSString *)file atLine:(NSUInteger)line expected:(BOOL)expected
{
    if(expectFailure)
    {
        didRecordFailure = YES;
    }
    else
    {
        [super recordFailureWithDescription:description inFile:file atLine:line expected:expected];
    }
}

#endif


- (void)testExactlyThrowsWhenCountTooSmall
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];

    XCTAssertThrows([[[mock verify] withQuantifier:[OCMQuantifier exactly:2]] doStuff]);
}

- (void)testExactlyMatchesCount
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];
    [mock doStuff];

    [[[mock verify] withQuantifier:[OCMQuantifier exactly:2]] doStuff];
}

- (void)testExactlyThrowsWhenCountTooLarge
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];
    [mock doStuff];
    [mock doStuff];

    XCTAssertThrows([[[mock verify] withQuantifier:[OCMQuantifier exactly:2]] doStuff]);
}


- (void)testAtLeastThrowsWhenMinimumCountIsNotReached
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];

    XCTAssertThrows([[[mock verify] withQuantifier:[OCMQuantifier atLeast:2]] doStuff]);
}

- (void)testAtLeastMatchesMinimumCount
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];
    [mock doStuff];

    [[[mock verify] withQuantifier:[OCMQuantifier atLeast:2]] doStuff];
}

- (void)testAtLeastMatchesMoreThanMinimumCount
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];
    [mock doStuff];
    [mock doStuff];

    [[[mock verify] withQuantifier:[OCMQuantifier atLeast:2]] doStuff];
}

- (void)testAtLeastThrowsWhenInitializedWithZeroCount
{
    XCTAssertThrows([OCMQuantifier atLeast:0]);
}


- (void)testAtMostMatchesUpToMaximumCount
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];

    [[[mock verify] withQuantifier:[OCMQuantifier atMost:1]] doStuff];
}

- (void)testAtMostThrowsWhenMaximumCountIsExceeded
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];
    [mock doStuff];

    XCTAssertThrows([[[mock verify] withQuantifier:[OCMQuantifier atMost:1]] doStuff]);
}

- (void)testAtMostThrowsWhenInitializedWithZeroCount
{
    XCTAssertThrows([OCMQuantifier atMost:0]);
}


- (void)testNeverThrowsWhenInvocationsOccurred
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);

    [mock doStuff];

    XCTAssertThrows([[[mock verify] withQuantifier:[OCMQuantifier never]] doStuff]);
}


- (void)testQuantifierMacro
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);
    [mock doStuff];
    [mock doStuff];
    OCMVerify(OCMAtLeast(2), [mock doStuff]);
}

- (void)testQuantifierMacroFailure
{
    id mock = OCMClassMock([TestClassForQuantifiers class]);
    expectFailure = YES;
    OCMVerify(OCMAtLeast(1), [mock doStuff]);
    expectFailure = NO;
    XCTAssertTrue(didRecordFailure);
}

@end
