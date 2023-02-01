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

#import <XCTest/XCTest.h>
#import "OCMock.h"

#if !defined(__cplusplus)
#error This file must be compiled with C++
#endif

#if !__has_feature(cxx_nullptr)
#error This file must be compiled with a version of C++ that supports nullptr
#endif

@interface OCMCPlusPlus11Tests : XCTestCase
@end


@implementation OCMCPlusPlus11Tests

- (void)testSetsUpStubReturningNilForIdReturnType
{
    id mock = OCMPartialMock([NSArray arrayWithObject:@"Foo"]);

    OCMExpect([mock lastObject]).andReturn(nil);
    XCTAssertNil([mock lastObject], @"Should have returned stubbed value");

    OCMExpect([mock lastObject]).andReturn(Nil);
    XCTAssertNil([mock lastObject], @"Should have returned stubbed value");
}

@end
