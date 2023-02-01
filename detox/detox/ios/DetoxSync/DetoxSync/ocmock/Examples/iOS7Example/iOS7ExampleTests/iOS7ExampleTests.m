//
//  iOS7ExampleTests.m
//  iOS7ExampleTests
//
//  Created by Erik Doernenburg on 10/06/2014.
//  Copyright (c) 2014 Erik Doernenburg. All rights reserved.
//

#import <XCTest/XCTest.h>
#import <OCMock/OCMock.h>
#import <UIKit/UIKit.h>
#import "MasterViewController.h"

@interface iOS7ExampleTests : XCTestCase

@end

@implementation iOS7ExampleTests

- (void)setUp
{
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown
{
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testMasterViewControllerDeletesItemsFromTableView
{
    // Test set-up

    MasterViewController *controller = [[MasterViewController alloc] init];
    NSIndexPath *dummyIndexPath = [NSIndexPath indexPathForRow:1 inSection:0];
    
    id tableViewMock = OCMClassMock([UITableView class]);
    
    // Invoke functionality to be tested
    // If you want to see the test fail you can, for example, change the editing style to
    // UITableViewCellEditingStyleNone. In that case the method in the controller does not
    // make a call to the table view and the mock will raise an exception when verify is
    // called further down.
    
    [controller tableView:tableViewMock commitEditingStyle:UITableViewCellEditingStyleDelete forRowAtIndexPath:dummyIndexPath];
    
    // Verify that expected methods were called
    
    OCMVerify([tableViewMock deleteRowsAtIndexPaths:[NSArray arrayWithObject:dummyIndexPath] withRowAnimation:UITableViewRowAnimationFade]);
}

@end
