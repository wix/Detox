/*
 *  Copyright (c) 2020-2021 Erik Doernenburg and contributors
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

#import <OCMock/OCMockObject.h>
#import <XCTest/XCTest.h>
#import <objc/runtime.h>
#import "OCMFunctions.h"
#import "OCMFunctionsPrivate.h"

@interface TestClassForFunctions : NSObject
- (void)setFoo:(NSString *)aString;
@end

@implementation TestClassForFunctions

- (void)setFoo:(NSString *)aString;
{
}

- (void)methodWithByRef:(byref id)foo
{
}

@end


@interface OCMFunctionsTests : XCTestCase
@end

@implementation OCMFunctionsTests

- (void)testObjCTypeWithoutQualifiersCorrectsHandlingOfByRefArgType
{
    Method method = class_getInstanceMethod([TestClassForFunctions class], @selector(methodWithByRef:));
    char *argType = method_copyArgumentType(method, 2);
    XCTAssertNotEqual(argType, NULL);

    // First confirm that the suspected bug is still present
    XCTAssertNotEqualObjects(@"@", [NSString stringWithUTF8String:argType]);

    // Now test that the OCMock function returns the correct type anyway
    const char *actual = OCMTypeWithoutQualifiers(argType);
    XCTAssertEqualObjects(@"@", [NSString stringWithUTF8String:actual]);

    free(argType);
}

- (void)testIsBlockReturnsFalseForClass
{
    XCTAssertFalse(OCMIsBlock([NSString class]));
}

- (void)testIsBlockReturnsFalseForObject
{
    XCTAssertFalse(OCMIsBlock([NSArray array]));
}

- (void)testIsBlockReturnsFalseForNil
{
    XCTAssertFalse(OCMIsBlock(nil));
}

- (void)testIsBlockReturnsTrueForBlock
{
    XCTAssertTrue(OCMIsBlock(^ { }));
}

- (void)testIsMockSubclassOnlyReturnYesForActualSubclass
{
    id object = [TestClassForFunctions new];
    XCTAssertFalse(OCMIsMockSubclass([object class]));

    id mock __unused = [OCMockObject partialMockForObject:object];
    XCTAssertTrue(OCMIsMockSubclass(object_getClass(object)));

    // adding a KVO observer creates and sets a subclass of the mock subclass
    [object addObserver:self forKeyPath:@"foo" options:NSKeyValueObservingOptionNew context:NULL];
    XCTAssertFalse(OCMIsMockSubclass(object_getClass(object)));

    [object removeObserver:self forKeyPath:@"foo" context:NULL];
}

- (void)testIsSubclassOfMockSubclassReturnYesForSubclasses
{
    id object = [TestClassForFunctions new];
    XCTAssertFalse(OCMIsMockSubclass([object class]));

    id mock __unused = [OCMockObject partialMockForObject:object];
    XCTAssertTrue(OCMIsSubclassOfMockClass(object_getClass(object)));

    // adding a KVO observer creates and sets a subclass of the mock subclass
    [object addObserver:self forKeyPath:@"foo" options:NSKeyValueObservingOptionNew context:NULL];
    XCTAssertTrue(OCMIsSubclassOfMockClass(object_getClass(object)));

    [object removeObserver:self forKeyPath:@"foo" context:NULL];
}


- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
}

@end
