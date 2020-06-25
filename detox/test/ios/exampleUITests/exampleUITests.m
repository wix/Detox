//
//  exampleUITests.m
//  exampleUITests
//
//  Created by Leo Natan (Wix) on 5/7/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>

@interface exampleUITests : XCTestCase

@end

@implementation exampleUITests

- (void)setUp {
    // Put setup code here. This method is called before the invocation of each test method in the class.

    // In UI tests it is usually best to stop immediately when a failure occurs.
    self.continueAfterFailure = NO;

    // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
}

- (void)testExample {
    // UI tests must launch the application that they test.
    XCUIApplication *app = [[XCUIApplication alloc] init];
    [app launch];

	[NSThread sleepForTimeInterval:1];
	
	[app.otherElements[@"Matchers"] tap];
	
	[NSThread sleepUntilDate:NSDate.distantFuture];
}

@end
