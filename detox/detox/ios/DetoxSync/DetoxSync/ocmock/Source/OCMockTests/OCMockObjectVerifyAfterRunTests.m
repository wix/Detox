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


@interface TestBaseClassForVerifyAfterRun : NSObject

+ (NSString *)classMethod1;
- (NSString *)method2;

@end

@implementation TestBaseClassForVerifyAfterRun

+ (NSString *)classMethod1
{
    return @"Foo-ClassMethod";
}

- (NSString *)method2
{
    return @"Foo";
}

@end

@interface TestClassForVerifyAfterRun : TestBaseClassForVerifyAfterRun

- (NSString *)method1;

@end

@implementation TestClassForVerifyAfterRun

- (NSString *)method1
{
    id retVal = [self method2];
    return retVal;
}

@end

@interface OCMockObjectVerifyAfterRunTests : XCTestCase

@end


@implementation OCMockObjectVerifyAfterRunTests

- (void)testDoesNotThrowWhenMethodWasInvoked
{
    id mock = [OCMockObject niceMockForClass:[NSString class]];

    [mock lowercaseString];

    XCTAssertNoThrow([[mock verify] lowercaseString], @"Should not have thrown an exception for method that was called.");
}

- (void)testThrowsWhenMethodWasNotInvoked
{
    id mock = [OCMockObject niceMockForClass:[NSString class]];

    [mock lowercaseString];

    XCTAssertThrows([[mock verify] uppercaseString], @"Should have thrown an exception for a method that was not called.");
}

- (void)testDoesNotThrowWhenMethodWasInvokedOnPartialMock
{
    TestClassForVerifyAfterRun *testObject = [[TestClassForVerifyAfterRun alloc] init];
    id mock = [OCMockObject partialMockForObject:testObject];

    [mock method2];

    XCTAssertNoThrow([[mock verify] method2], @"Should not have thrown an exception for method that was called.");
}

- (void)testDoesNotThrowWhenMethodWasInvokedOnRealObjectEvenInSuperclass
{
    TestClassForVerifyAfterRun *testObject = [[TestClassForVerifyAfterRun alloc] init];
    id mock = [OCMockObject partialMockForObject:testObject];

    NSString *string = [testObject method1];

    XCTAssertEqualObjects(@"Foo", string, @"Should have returned value from actual implementation.");
    XCTAssertNoThrow([[mock verify] method2], @"Should not have thrown an exception for method that was called.");
}

- (void)testDoesNotThrowWhenClassMethodWasInvoked
{
    id mock = [OCMockObject niceMockForClass:[TestBaseClassForVerifyAfterRun class]];

    [TestBaseClassForVerifyAfterRun classMethod1];

    XCTAssertNoThrow([[mock verify] classMethod1], @"Should not have thrown an exception for class method that was called.");
}

- (void)testThrowsWhenClassMethodWasNotInvoked
{
    id mock = [OCMockObject niceMockForClass:[TestBaseClassForVerifyAfterRun class]];

    XCTAssertThrows([[mock verify] classMethod1], @"Should have thrown an exception for class method that was not called.");
}

- (void)testThrowsWhenVerificationIsAttemptedAfterStopMocking
{
    id mock = [OCMockObject niceMockForClass:[TestBaseClassForVerifyAfterRun class]];

    [TestBaseClassForVerifyAfterRun classMethod1];
    [mock stopMocking];

    @try
    {
        [[mock verify] classMethod1];
        XCTFail(@"Should have thrown an exception.");
    }
    @catch(NSException *e)
    {
        XCTAssertEqualObjects([e name], NSInternalInconsistencyException);
        XCTAssertTrue([[e reason] containsString:@"after stopMocking has been called"]);
    }
}


@end
