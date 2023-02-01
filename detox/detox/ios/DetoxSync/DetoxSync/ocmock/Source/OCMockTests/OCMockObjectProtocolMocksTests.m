/*
 *  Copyright (c) 2013-2021 Erik Doernenburg and contributors
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


#pragma mark Helper classes and protocols for testing

@protocol TestProtocol
+ (NSString *)stringValueClassMethod;
- (int)primitiveValue;
@optional
- (id)objectValue;
- (void)voidWithArgument:(id)argument;
@end

@interface InterfaceForTypedef : NSObject
{
    int prop1;
    NSObject *prop2;
}
@end

@implementation InterfaceForTypedef
@end

typedef InterfaceForTypedef TypedefInterface;
typedef InterfaceForTypedef *PointerTypedefInterface;

@protocol ProtocolWithTypedefs
- (TypedefInterface *)typedefReturnValue1;
- (PointerTypedefInterface)typedefReturnValue2;
- (void)typedefParameter:(TypedefInterface *)parameter;
@end


@interface OCMockObjectProtocolMocksTests : XCTestCase

@end


@implementation OCMockObjectProtocolMocksTests

#pragma mark Tests

- (void)testCanMockFormalProtocol
{
    id mock = [OCMockObject mockForProtocol:@protocol(NSLocking)];
    [[mock expect] lock];

    [mock lock];

    [mock verify];
}

- (void)testDescription
{
    id mock = [OCMockObject mockForProtocol:@protocol(NSLocking)];
    XCTAssertEqualObjects([mock description], @"OCProtocolMockObject(NSLocking)");
}

- (void)testRaisesWhenUnknownMethodIsCalledOnProtocol
{
    id mock = [OCMockObject mockForProtocol:@protocol(NSLocking)];
    XCTAssertThrows([mock lowercaseString], @"Should have raised an exception.");
}

- (void)testConformsToMockedProtocol
{
    id mock = [OCMockObject mockForProtocol:@protocol(NSLocking)];
    XCTAssertTrue([mock conformsToProtocol:@protocol(NSLocking)]);
}

- (void)testRespondsToValidProtocolRequiredSelector
{
    id mock = [OCMockObject mockForProtocol:@protocol(TestProtocol)];
    XCTAssertTrue([mock respondsToSelector:@selector(primitiveValue)]);
}

- (void)testRespondsToValidProtocolOptionalSelector
{
    id mock = [OCMockObject mockForProtocol:@protocol(TestProtocol)];
    XCTAssertTrue([mock respondsToSelector:@selector(objectValue)]);
}

- (void)testDoesNotRespondToInvalidProtocolSelector
{
    id mock = [OCMockObject mockForProtocol:@protocol(TestProtocol)];
    XCTAssertFalse([mock respondsToSelector:@selector(testDoesNotRespondToInvalidProtocolSelector)]);
}

- (void)testWithTypedefReturnType
{
    id mock = [OCMockObject mockForProtocol:@protocol(ProtocolWithTypedefs)];
    XCTAssertNoThrow([[[mock stub] andReturn:[TypedefInterface new]] typedefReturnValue1], @"Should accept a typedefed return-type");
    XCTAssertNoThrow([mock typedefReturnValue1]);
}

- (void)testWithTypedefPointerReturnType
{
    id mock = [OCMockObject mockForProtocol:@protocol(ProtocolWithTypedefs)];
    XCTAssertNoThrow([[[mock stub] andReturn:[TypedefInterface new]] typedefReturnValue2], @"Should accept a typedefed return-type");
    XCTAssertNoThrow([mock typedefReturnValue2]);
}

- (void)testWithTypedefParameter
{
    id mock = [OCMockObject mockForProtocol:@protocol(ProtocolWithTypedefs)];
    XCTAssertNoThrow([[mock stub] typedefParameter:nil], @"Should accept a typedefed parameter-type");
    XCTAssertNoThrow([mock typedefParameter:nil]);
}


- (void)testReturnDefaultValueWhenUnknownMethodIsCalledOnNiceProtocolMock
{
    id mock = [OCMockObject niceMockForProtocol:@protocol(TestProtocol)];
    XCTAssertTrue(0 == [mock primitiveValue], @"Should return 0 on unexpected method call (for nice mock).");
    [mock verify];
}

- (void)testRaisesAnExceptionWenAnExpectedMethodIsNotCalledOnNiceProtocolMock
{
    id mock = [OCMockObject niceMockForProtocol:@protocol(TestProtocol)];
    [[mock expect] primitiveValue];
    XCTAssertThrows([mock verify], @"Should have raised an exception because method was not called.");
}

- (void)testProtocolClassMethod
{
    id mock = OCMProtocolMock(@protocol(TestProtocol));
    OCMStub([mock stringValueClassMethod]).andReturn(@"stubbed");
    id result = [mock stringValueClassMethod];
    XCTAssertEqual(@"stubbed", result, @"Should have stubbed the class method.");
}

- (void)testRefusesToCreateProtocolMockForNilProtocol
{
    XCTAssertThrows(OCMProtocolMock(nil));
}

- (void)testArgumentsGetReleasedAfterStopMocking
{
    __weak id weakArgument;
    id mock = OCMProtocolMock(@protocol(TestProtocol));
    @autoreleasepool
    {
        NSObject *argument = [NSObject new];
        weakArgument = argument;
        [mock voidWithArgument:argument];
        [mock stopMocking];
    }
    XCTAssertNil(weakArgument);
}

@end
