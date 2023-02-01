//
//  iOS9ExampleTests.m
//  iOS9ExampleTests
//
//  Created by Erik Doernenburg on 29/09/2015.
//  Copyright © 2015 Erik Doernenburg. All rights reserved.
//

#import <XCTest/XCTest.h>
#import <OCMock/OCMock.h>
#import "MasterViewController.h"

@interface iOS9ExampleTests : XCTestCase

@end

@implementation iOS9ExampleTests

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

    OCMVerify([tableViewMock deleteRowsAtIndexPaths:@[dummyIndexPath] withRowAnimation:UITableViewRowAnimationFade]);
}

@end
