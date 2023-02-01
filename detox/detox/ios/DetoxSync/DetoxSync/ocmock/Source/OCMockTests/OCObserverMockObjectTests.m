/*
 *  Copyright (c) 2009-2021 Erik Doernenburg and contributors
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


static NSString *TestNotificationOne = @"TestNotificationOne";


@interface OCObserverMockObjectTest : XCTestCase
{
    NSNotificationCenter *center;
    id mock;
}

@end


@implementation OCObserverMockObjectTest

- (void)setUp
{
    center = [[NSNotificationCenter alloc] init];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    mock = [OCMockObject observerMock];
#pragma clang diagnostic pop
}

- (void)testAcceptsExpectedNotification
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:[OCMArg any]];

    [center postNotificationName:TestNotificationOne object:self];

    [mock verify];
}

- (void)testAcceptsExpectedNotificationWithSpecifiedObjectAndUserInfo
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    NSDictionary *info = @{ @"key" : @"foo" };
    [[mock expect] notificationWithName:TestNotificationOne object:self userInfo:info];

    [center postNotificationName:TestNotificationOne object:self userInfo:info];

    [mock verify];
}

- (void)testAcceptsNotificationsInAnyOrder
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:self];
    [[mock expect] notificationWithName:TestNotificationOne object:[OCMArg any]];

    [center postNotificationName:TestNotificationOne object:[NSString string]];
    [center postNotificationName:TestNotificationOne object:self];
}

- (void)testAcceptsNotificationsInCorrectOrderWhenOrderMatters
{
    [mock setExpectationOrderMatters:YES];

    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:self];
    [[mock expect] notificationWithName:TestNotificationOne object:[OCMArg any]];

    [center postNotificationName:TestNotificationOne object:self];
    [center postNotificationName:TestNotificationOne object:[NSString string]];
}

- (void)testRaisesExceptionWhenSequenceIsWrongAndOrderMatters
{
    [mock setExpectationOrderMatters:YES];

    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:self];
    [[mock expect] notificationWithName:TestNotificationOne object:[OCMArg any]];

    XCTAssertThrows([center postNotificationName:TestNotificationOne object:[NSString string]], @"Should have complained about sequence.");
}

- (void)testRaisesEvenThoughOverlappingExpectationsCouldHaveBeenSatisfied
{
    // this test demonstrates a shortcoming, not a feature
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:[OCMArg any]];
    [[mock expect] notificationWithName:TestNotificationOne object:self];

    [center postNotificationName:TestNotificationOne object:self];
    XCTAssertThrows([center postNotificationName:TestNotificationOne object:[NSString string]]);
}

- (void)testRaisesExceptionWhenUnexpectedNotificationIsReceived
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];

    XCTAssertThrows([center postNotificationName:TestNotificationOne object:self]);
}

- (void)testRaisesWhenNotificationWithWrongObjectIsReceived
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:self];

    XCTAssertThrows([center postNotificationName:TestNotificationOne object:[NSString string]]);
}

- (void)testRaisesWhenNotificationWithWrongUserInfoIsReceived
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:self userInfo:@{ @"key" : @"foo" }];
    XCTAssertThrows([center postNotificationName:TestNotificationOne object:[NSString string] userInfo:@{ @"key" : @"bar" }]);
}

- (void)testRaisesOnVerifyWhenExpectedNotificationIsNotSent
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:[OCMArg any]];

    XCTAssertThrows([mock verify]);
}

- (void)testRaisesOnVerifyWhenNotAllNotificationsWereSent
{
    [center addMockObserver:mock name:TestNotificationOne object:nil];
    [[mock expect] notificationWithName:TestNotificationOne object:[OCMArg any]];
    [[mock expect] notificationWithName:TestNotificationOne object:self];

    [center postNotificationName:TestNotificationOne object:self];
    XCTAssertThrows([mock verify]);
}

- (void)testChecksNotificationNamesCorrectly
{
    NSString *notificationName = @"MyNotification";

    [center addMockObserver:mock name:notificationName object:nil];
    [[mock expect] notificationWithName:[notificationName mutableCopy] object:[OCMArg any]];

    [center postNotificationName:notificationName object:self];

    [mock verify];
}

@end
