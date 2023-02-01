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

#import <OCHamcrest/OCHamcrest.h>
#import <XCTest/XCTest.h>
#import "OCMock.h"


@interface OCMockObjectHamcrestTests : XCTestCase

@end


@implementation OCMockObjectHamcrestTests

- (void)testAcceptsStubbedMethodWithHamcrestConstraint
{
    id mock = [OCMockObject mockForClass:[NSString class]];
    [[mock stub] hasSuffix:(id)startsWith(@"foo")];
    [mock hasSuffix:@"foobar"];
}


- (void)testRejectsUnstubbedMethodWithHamcrestConstraint
{
    id mock = [OCMockObject mockForClass:[NSString class]];
    [[mock stub] hasSuffix:(id)anyOf(equalTo(@"foo"), equalTo(@"bar"), NULL)];
    XCTAssertThrows([mock hasSuffix:@"foobar"], @"Should have raised an exception.");
}


@end
