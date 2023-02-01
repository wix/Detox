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
#import "OCMock.h"


@protocol TestProtocolForMacroTesting
- (NSString *)stringValue;
@end

@interface TestClassForMacroTesting : NSObject<TestProtocolForMacroTesting>

@end

@implementation TestClassForMacroTesting

- (NSString *)stringValue
{
    return @"FOO";
}

@end


@interface TestClassWithDecimalReturnMethod : NSObject

- (NSDecimalNumber *)method;

@end

@implementation TestClassWithDecimalReturnMethod

- (NSDecimalNumber *)method
{
    return nil;
}

@end

@interface TestClassWithClassReturnMethod : NSObject

- (Class)method;

@end

@implementation TestClassWithClassReturnMethod

- (Class)method
{
    return [self class];
}

@end

@interface TestClassWithLazyMock : NSObject

- (id)mock;

@end

@implementation TestClassWithLazyMock
{
    id mock;
}

- (id)mock
{
    if(mock == nil)
        mock = OCMClassMock([NSString class]);
    return mock;
}

@end

// implemented in OCMockObjectClassMethodMockingTests

@interface TestClassWithClassMethods : NSObject
+ (NSString *)foo;
+ (NSString *)bar;
- (NSString *)bar;
@end


@interface OCMockObjectMacroTests : XCTestCase
{
    BOOL shouldCaptureFailure;
    NSString *reportedDescription;
    NSString *reportedFile;
    NSInteger reportedLine;
}

@end


@implementation OCMockObjectMacroTests

#if defined(__IPHONE_14_0) && !defined(OCM_DISABLE_XCTEST_FEATURES) // this is actually a test for Xcode 12; see issue #472

- (void)recordIssue:(XCTIssue *)issue
{
    if(shouldCaptureFailure)
    {
        reportedDescription = issue.compactDescription;
        reportedFile = issue.sourceCodeContext.location.fileURL.path;
        reportedLine = issue.sourceCodeContext.location.lineNumber;
    }
    else
    {
        [super recordIssue:issue];
    }
}

#else

- (void)recordFailureWithDescription:(NSString *)description inFile:(NSString *)file atLine:(NSUInteger)line expected:(BOOL)expected
{
    if(shouldCaptureFailure)
    {
        reportedDescription = description;
        reportedFile = file;
        reportedLine = line;
    }
    else
    {
        [super recordFailureWithDescription:description inFile:file atLine:line expected:expected];
    }
}

#endif

- (void)testReportsVerifyFailureWithCorrectLocation
{
    id mock = OCMClassMock([NSString class]);

    [[mock expect] lowercaseString];

    shouldCaptureFailure = YES;
    OCMVerifyAll(mock); const char *expectedFile = __FILE__; int expectedLine = __LINE__;
    shouldCaptureFailure = NO;

    XCTAssertNotNil(reportedDescription, @"Should have recorded a failure with description.");
    XCTAssertTrue([reportedFile hasSuffix:[NSString stringWithUTF8String:expectedFile]], @"Should have reported correct file.");
    XCTAssertEqual(expectedLine, (int)reportedLine, @"Should have reported correct line");
}

- (void)testReportsIgnoredExceptionsAtVerifyLocation
{
    id mock = OCMClassMock([NSString class]);

    [[mock reject] lowercaseString];

    @try
    {
        [mock lowercaseString];
    }
    @catch(NSException *exception)
    {
        // ignore; the mock will rethrow this in verify
    }

    shouldCaptureFailure = YES;
    OCMVerifyAll(mock); const char *expectedFile = __FILE__; int expectedLine = __LINE__;
    shouldCaptureFailure = NO;

    XCTAssertTrue([reportedDescription rangeOfString:@"ignored"].location != NSNotFound, @"Should have reported ignored exceptions.");
    XCTAssertTrue([reportedFile hasSuffix:[NSString stringWithUTF8String:expectedFile]], @"Should have reported correct file.");
    XCTAssertEqual(expectedLine, (int)reportedLine, @"Should have reported correct line");
}

- (void)testReportsVerifyWithDelayFailureWithCorrectLocation
{
    id mock = OCMClassMock([NSString class]);

    [[mock expect] lowercaseString];

    shouldCaptureFailure = YES;
    OCMVerifyAllWithDelay(mock, 0.05); const char *expectedFile = __FILE__; int expectedLine = __LINE__;
    shouldCaptureFailure = NO;

    XCTAssertNotNil(reportedDescription, @"Should have recorded a failure with description.");
    XCTAssertTrue([reportedFile hasSuffix:[NSString stringWithUTF8String:expectedFile]], @"Should have reported correct file.");
    XCTAssertEqual(expectedLine, (int)reportedLine, @"Should have reported correct line");
}


- (void)testSetsUpStubsForCorrectMethods
{
    id mock = OCMStrictClassMock([NSString class]);

    OCMStub([mock uppercaseString]).andReturn(@"TEST_STRING");

    XCTAssertEqualObjects(@"TEST_STRING", [mock uppercaseString], @"Should have returned stubbed value");
    XCTAssertThrows([mock lowercaseString]);
}

- (void)testSetsUpStubsWithNonObjectReturnValues
{
    id mock = OCMStrictClassMock([NSString class]);

    OCMStub([mock boolValue]).andReturn(YES);

    XCTAssertEqual(YES, [mock boolValue], @"Should have returned stubbed value");
}

- (void)testSetsUpStubsWithStructureReturnValues
{
    id mock = OCMStrictClassMock([NSString class]);

    NSRange expected = NSMakeRange(123, 456);
    OCMStub([mock rangeOfString:[OCMArg any]]).andReturn(expected);

    NSRange actual = [mock rangeOfString:@"substring"];
    XCTAssertEqual((NSUInteger)123, actual.location, @"Should have returned stubbed value");
    XCTAssertEqual((NSUInteger)456, actual.length, @"Should have returned stubbed value");
}

- (void)testSetsUpStubReturningNilForIdReturnType
{
    id mock = OCMPartialMock([NSArray arrayWithObject:@"Foo"]);

    OCMStub([mock lastObject]).andReturn(nil);
    XCTAssertNil([mock lastObject], @"Should have returned stubbed value");
}

- (void)testSetsUpStubReturningNilForClassReturnType
{
    id mock = OCMPartialMock([[TestClassWithClassReturnMethod alloc] init]);

    OCMStub([mock method]).andReturn(Nil);
    XCTAssertNil([mock method], @"Should have returned stubbed value");

    // sometimes nil is used where Nil should be used
    OCMStub([mock method]).andReturn(nil);
    XCTAssertNil([mock method], @"Should have returned stubbed value");
}

- (void)testSetsUpExceptionThrowing
{
    id mock = OCMClassMock([NSString class]);

    OCMStub([mock uppercaseString]).andThrow([NSException exceptionWithName:@"TestException" reason:@"Testing" userInfo:nil]);

    XCTAssertThrowsSpecificNamed([mock uppercaseString], NSException, @"TestException", @"Should have thrown correct exception");
}

- (void)testSetsUpNotificationPostingAndNotificationObserving
{
    id mock = OCMProtocolMock(@protocol(TestProtocolForMacroTesting));

    NSNotification *n = [NSNotification notificationWithName:@"TestNotification" object:nil];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    id observer = OCMObserverMock();
#pragma clang diagnostic pop
    [[NSNotificationCenter defaultCenter] addMockObserver:observer name:[n name] object:nil];
    OCMExpect([observer notificationWithName:[n name] object:[OCMArg any]]);

    OCMStub([mock stringValue]).andPost(n);

    [mock stringValue];

    OCMVerifyAll(observer);
}

- (void)testNotificationObservingWithUserInfo
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    id observer = OCMObserverMock();
#pragma clang diagnostic pop
    [[NSNotificationCenter defaultCenter] addMockObserver:observer name:@"TestNotificationWithInfo" object:nil];
    OCMExpect([observer notificationWithName:@"TestNotificationWithInfo" object:[OCMArg any] userInfo:[OCMArg any]]);

    [[NSNotificationCenter defaultCenter] postNotificationName:@"TestNotificationWithInfo" object:self userInfo:@{ @"foo" : @"bar" }];

    OCMVerifyAll(observer);
}


- (void)testSetsUpSubstituteCall
{
    id mock = OCMStrictProtocolMock(@protocol(TestProtocolForMacroTesting));

    OCMStub([mock stringValue]).andCall(self, @selector(stringValueForTesting));

    XCTAssertEqualObjects([mock stringValue], @"TEST_STRING_FROM_TESTCASE", @"Should have called method from test case");
}

- (NSString *)stringValueForTesting
{
    return @"TEST_STRING_FROM_TESTCASE";
}

#ifndef OCM_DISABLE_XCTEST_FEATURES

- (void)testFulfillsExpectation
{
    id mock = OCMStrictClassMock([NSString class]);

    OCMStub([mock boolValue]).andFulfill([self expectationWithDescription:@"Expectation Called"]).andReturn(YES);

    XCTAssertTrue([mock boolValue]);
    [self waitForExpectationsWithTimeout:0 handler:nil];
}

#endif

- (void)testCanChainPropertyBasedActions
{
    id mock = OCMPartialMock([[TestClassForMacroTesting alloc] init]);

    __block BOOL didCallBlock = NO;
    void (^theBlock)(NSInvocation *) = ^(NSInvocation *invocation) {
        didCallBlock = YES;
    };

    OCMStub([mock stringValue]).andDo(theBlock).andForwardToRealObject();

    NSString *actual = [mock stringValue];

    XCTAssertTrue(didCallBlock, @"Should have called block");
    XCTAssertEqualObjects(@"FOO", actual, @"Should have forwarded invocation");
}


- (void)testCanUseVariablesInInvocationSpec
{
    id mock = OCMStrictClassMock([NSString class]);

    NSString *expected = @"foo";
    OCMStub([mock rangeOfString:expected]).andReturn(NSMakeRange(0, 3));

    XCTAssertThrows([mock rangeOfString:@"bar"], @"Should not have accepted invocation with non-matching arg.");
}


- (void)testSetsUpExpectations
{
    id mock = OCMClassMock([TestClassForMacroTesting class]);

    OCMExpect([mock stringValue]).andReturn(@"TEST_STRING");

    XCTAssertThrows([mock verify], @"Should have complained about expected method not being invoked");

    XCTAssertEqual([mock stringValue], @"TEST_STRING", @"Should have stubbed method, too");
    XCTAssertNoThrow([mock verify], @"Should have accepted invocation as matching expectation");
}


- (void)testSetsUpReject
{
    id mock = OCMClassMock([TestClassForMacroTesting class]);

    OCMReject([mock stringValue]);

    XCTAssertNoThrow([mock verify], @"Should have accepted invocation rejected method not being invoked");
    XCTAssertThrows([mock stringValue], @"Should have complained during rejected method being invoked");
    XCTAssertThrows([mock verify], @"Should have complained about rejected method being invoked");
}

- (void)testThrowsWhenTryingToAddActionToReject
{
    id mock = OCMClassMock([TestClassForMacroTesting class]);
    XCTAssertThrows(OCMReject([mock stringValue]).andReturn(@"Foo"));
}

- (void)testShouldNotReportErrorWhenMethodWasInvoked
{
    id mock = OCMClassMock([NSString class]);

    [mock lowercaseString];

    shouldCaptureFailure = YES;
    OCMVerify([mock lowercaseString]);
    shouldCaptureFailure = NO;

    XCTAssertNil(reportedDescription, @"Should not have recorded a failure.");
}

- (void)testShouldReportErrorWhenMethodWasNotInvoked
{
    id mock = OCMClassMock([NSString class]);

    [mock lowercaseString];

    shouldCaptureFailure = YES;
    OCMVerify([mock uppercaseString]); const char *expectedFile = __FILE__; int expectedLine = __LINE__;
    shouldCaptureFailure = NO;

    XCTAssertNotNil(reportedDescription, @"Should have recorded a failure with description.");
    XCTAssertTrue([reportedFile hasSuffix:[NSString stringWithUTF8String:expectedFile]], @"Should have reported correct file.");
    XCTAssertEqual(expectedLine, (int)reportedLine, @"Should have reported correct line");
}

- (void)testShouldThrowDescriptiveExceptionWhenTryingToVerifyUnimplementedMethod
{
    id mock = OCMClassMock([NSString class]);

    // have not found a way to report the error; it seems we must throw an
    // exception to get out of the forwarding machinery
    XCTAssertThrowsSpecificNamed(OCMVerify([mock arrayByAddingObject:@"foo"]),
            NSException, NSInvalidArgumentException, @"should throw NSInvalidArgumentException exception");
}


- (void)testShouldThrowExceptionWhenNotUsingMockInMacroThatRequiresMock
{
    id realObject = [NSMutableArray array];

    XCTAssertThrowsSpecificNamed(OCMStub([realObject addObject:@"foo"]), NSException, NSInternalInconsistencyException);
    XCTAssertThrowsSpecificNamed(OCMExpect([realObject addObject:@"foo"]), NSException, NSInternalInconsistencyException);
    XCTAssertThrowsSpecificNamed(OCMReject([realObject addObject:@"foo"]), NSException, NSInternalInconsistencyException);
    XCTAssertThrowsSpecificNamed(OCMVerify([realObject addObject:@"foo"]), NSException, NSInternalInconsistencyException);
}

- (void)testShouldHintAtPossibleReasonWhenNotUsingMockInMacroThatRequiresMock
{
    @try
    {
        id realObject = [NSMutableArray array];
        OCMStub([realObject addObject:@"foo"]);
    }
    @catch(NSException *e)
    {
        XCTAssertTrue([[e reason] containsString:@"The receiver is not a mock object."]);
    }
}

- (void)testShouldThrowExceptionWhenMockingMethodThatCannotBeMocked
{
    id mock = OCMClassMock([NSString class]);

    XCTAssertThrowsSpecificNamed(OCMStub([mock description]), NSException, NSInternalInconsistencyException);
    XCTAssertThrowsSpecificNamed(OCMExpect([mock description]), NSException, NSInternalInconsistencyException);
    XCTAssertThrowsSpecificNamed(OCMReject([mock description]), NSException, NSInternalInconsistencyException);
    XCTAssertThrowsSpecificNamed(OCMVerify([mock description]), NSException, NSInternalInconsistencyException);
}

- (void)testShouldHintAtPossibleReasonWhenMockingMethodThatCannotBeMocked
{
    @try
    {
        id mock = OCMClassMock([NSString class]);
        OCMStub([mock description]);
    }
    @catch(NSException *e)
    {
        XCTAssertTrue([[e reason] containsString:@"The selector conflicts with a selector implemented by OCMStubRecorder/OCMExpectationRecorder."]);
    }
}

- (void)testShouldHintAtPossibleReasonWhenVerifyingMethodThatCannotBeMocked
{
    @try
    {
        id mock = OCMClassMock([NSString class]);
        OCMVerify([mock description]);
    }
    @catch(NSException *e)
    {
        XCTAssertTrue([[e reason] containsString:@"The selector conflicts with a selector implemented by OCMVerifier."]);
    }
}


- (void)testCanExplicitlySelectClassMethodForStubs
{
    id mock = OCMClassMock([TestClassWithClassMethods class]);

    OCMStub(ClassMethod([mock bar])).andReturn(@"mocked-class");
    OCMStub([mock bar]).andReturn(@"mocked-instance");

    XCTAssertEqualObjects(@"mocked-class", [TestClassWithClassMethods bar], @"Should have stubbed class method.");
    XCTAssertEqualObjects(@"mocked-instance", [mock bar], @"Should have stubbed instance method.");
}

- (void)testSelectsInstanceMethodForStubsWhenAmbiguous
{
    id mock = OCMClassMock([TestClassWithClassMethods class]);

    OCMStub([mock bar]).andReturn(@"mocked-instance");

    XCTAssertEqualObjects(@"mocked-instance", [mock bar], @"Should have stubbed instance method.");
}

- (void)testSelectsClassMethodForStubsWhenUnambiguous
{
    id mock = OCMClassMock([TestClassWithClassMethods class]);

    OCMStub([mock foo]).andReturn(@"mocked-class");

    XCTAssertEqualObjects(@"mocked-class", [TestClassWithClassMethods foo], @"Should have stubbed class method.");
}


- (void)testCanExplicitlySelectClassMethodForVerify
{
    id mock = OCMClassMock([TestClassWithClassMethods class]);

    [TestClassWithClassMethods bar];

    OCMVerify(ClassMethod([mock bar]));
}

- (void)testSelectsInstanceMethodForVerifyWhenAmbiguous
{
    id mock = OCMClassMock([TestClassWithClassMethods class]);

    [mock bar];

    OCMVerify([mock bar]);
}

- (void)testSelectsClassMethodForVerifyWhenUnambiguous
{
    id mock = OCMClassMock([TestClassWithClassMethods class]);

    [TestClassWithClassMethods foo];

    OCMVerify([mock foo]);
}


- (void)testCanUseMacroToStubMethodWithDecimalReturnValue
{
    id mock = OCMClassMock([TestClassWithDecimalReturnMethod class]);

    OCMStub([mock method]).andReturn([NSDecimalNumber decimalNumberWithDecimal:[@0 decimalValue]]);

    XCTAssertEqualObjects([mock method], [NSDecimalNumber decimalNumberWithDecimal:[@0 decimalValue]]);
}


- (void)testCanUseMacroToStubMethodWithAnyNonObjectArgument
{
    id mock = OCMStrictClassMock([NSString class]);

    OCMStub([mock commonPrefixWithString:@"foo" options:0]).ignoringNonObjectArgs();

    XCTAssertNoThrow([mock commonPrefixWithString:@"foo" options:NSCaseInsensitiveSearch]);
}

- (void)testCanUseMacroToStubMethodWithAnyNonObjectArgumentChainedWithOCMStubRecorder
{
    id mock = OCMClassMock([NSString class]);

    OCMStub([mock commonPrefixWithString:@"foo" options:0]).ignoringNonObjectArgs().andReturn(@"f");

    XCTAssertEqualObjects(@"f", [mock commonPrefixWithString:@"foo" options:NSCaseInsensitiveSearch]);
}

- (void)testReturnsCorrectObjectFromInitMethodCalledOnRecorderInsideMacro
{
    // Because of the way the macros work, you can call recorder methods on the mock and they will
    // work correctly. Technically these are a mix of old syntax and new.
    //
    // There are no assertions here, the tests will crash with an incorrect implementation.
    //
    // Note that the andReturn:nil has to be first because this is the stub that will actually be
    // used and we're now making sure that a return value is specified for init methods.
    id mock = OCMClassMock([NSString class]);
    OCMStub([[mock andReturn:nil] initWithString:OCMOCK_ANY]);
    OCMStub([[mock ignoringNonObjectArgs] initWithString:OCMOCK_ANY]);
    OCMStub([[mock andReturnValue:nil] initWithString:OCMOCK_ANY]);
    OCMStub([[mock andThrow:nil] initWithString:OCMOCK_ANY]);
    OCMStub([[mock andPost:nil] initWithString:OCMOCK_ANY]);
    OCMStub([[mock andCall:nil onObject:nil] initWithString:OCMOCK_ANY]);
#ifndef OCM_DISABLE_XCTEST_FEATURES
    OCMStub([[mock andFulfill:nil] initWithString:OCMOCK_ANY]);
#endif
    OCMStub([[mock andDo:nil] initWithString:OCMOCK_ANY]);
    OCMStub([[mock andForwardToRealObject] initWithString:OCMOCK_ANY]);
    OCMExpect([[mock never] initWithString:OCMOCK_ANY]);
    __unused id value = [mock initWithString:@"hello"];
    _OCMVerify([(id)[mock withQuantifier:nil] initWithString:OCMOCK_ANY]);

    // Test multiple levels of recorder methods.
    OCMStub([[[[mock ignoringNonObjectArgs] andReturn:nil] andThrow:nil] initWithString:OCMOCK_ANY]);
}

- (void)testStubMacroPassesExceptionThrough
{
    id mock = OCMClassMock([TestClassForMacroTesting class]);
    @try
    {
        OCMStub([mock init]).andReturn(mock);
        XCTFail(@"An exception should have been thrown.");
    }
    @catch(NSException *exception)
    {
        XCTAssertEqualObjects(exception.name, NSInternalInconsistencyException);
        XCTAssertTrue([exception.reason containsString:@"Method init invoked twice on stub recorder"]);
    }
}

- (void)testExpectMacroPassesExceptionThrough
{
    id mock = OCMClassMock([TestClassForMacroTesting class]);
    @try
    {
        OCMExpect([mock init]).andReturn(mock);
        XCTFail(@"An exception should have been thrown.");
    }
    @catch(NSException *exception)
    {
        XCTAssertEqualObjects(exception.name, NSInternalInconsistencyException);
        XCTAssertTrue([exception.reason containsString:@"Method init invoked twice on stub recorder"]);
    }
}

- (void)testVerifyMacroPassExceptionsThrough
{
    id mock = OCMClassMock([TestClassForMacroTesting class]);
    @try
    {
        // The -Wunused-value is a workaround for https://bugs.llvm.org/show_bug.cgi?id=45245
        _Pragma("clang diagnostic push")
        _Pragma("clang diagnostic ignored \"-Wunused-value\"")
        OCMVerify([mock init]);
        _Pragma("clang diagnostic pop")
        XCTFail(@"An exception should have been thrown.");
    }
    @catch(NSException *exception)
    {
        XCTAssertEqualObjects(exception.name, NSInternalInconsistencyException);
        XCTAssertTrue([exception.reason containsString:@"Method init invoked twice on verifier"]);
    }
}

- (void)testMockGeneratedLazily
{
    TestClassWithLazyMock *lazyMock = [[TestClassWithLazyMock alloc] init];
    XCTAssertNoThrow(OCMStub([[lazyMock mock] lowercaseString]).andReturn(@"bar"));
}

@end
