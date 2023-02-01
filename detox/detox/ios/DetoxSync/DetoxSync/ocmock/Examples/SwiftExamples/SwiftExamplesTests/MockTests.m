//
//  MockTests.m
//  SwiftExamples
//
//  Created by Erik Doernenburg on 11/06/2014.
//  Copyright (c) 2014 Mulle Kybernetik. All rights reserved.
//

#import <XCTest/XCTest.h>
#import <OCMock/OCMock.h>
#import "SwiftExamplesTests-Swift.h"


@interface MockTests : XCTestCase

@end

@implementation MockTests

- (void)testThatOCMockWorksInSwiftProject
{
    id mock = OCMClassMock([NSString class]);
    
    [mock lowercaseString];
    
    OCMVerify([mock lowercaseString]);
}

- (void)testMockingAnObject
{
    id mock = OCMClassMock([ServerConnection class]);
    OCMStub([mock fetchData]).andReturn(@"stubbed!");
    
    Controller *controller = [Controller newController];
    controller.connection = mock;
    
    [controller redisplay];
    
    OCMVerify([mock fetchData]);
    XCTAssertEqualObjects(@"stubbed!", controller.data, @"Excpected stubbed data in controller.");
}

- (void)testPartiallyMockingAnObject
{
    ServerConnection *testConnection = [ServerConnection new];
    id mock = OCMPartialMock(testConnection);
    OCMStub([mock fetchData]).andReturn(@"stubbed!");
    
    Controller *controller = [Controller newController];
    controller.connection = testConnection;
    
    [controller redisplay];
    
    OCMVerify([mock fetchData]);
    XCTAssertEqualObjects(@"stubbed!", controller.data, @"Excpected stubbed data in controller.");
}

- (void)testPartiallyMockingAnObject2
{
    Controller *controller = [Controller newController];

    id mock = OCMPartialMock((NSObject *)controller.connection); // we know connection is derived from NSObject...
    OCMStub([mock fetchData]).andReturn(@"stubbed!");
    
    [controller redisplay];
    
    OCMVerify([mock fetchData]);
    XCTAssertEqualObjects(@"stubbed!", controller.data, @"Excpected stubbed data in controller.");
}

@end
