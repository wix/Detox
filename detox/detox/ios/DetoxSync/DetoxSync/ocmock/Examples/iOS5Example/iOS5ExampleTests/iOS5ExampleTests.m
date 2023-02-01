//
//  iOS5ExampleTests.m
//  iOS5ExampleTests
//

#import <OCMock/OCMock.h>
#import "MasterViewController.h"
#import "iOS5ExampleTests.h"

@implementation iOS5ExampleTests

- (void)setUp
{
    [super setUp];
    
    // Set-up code here.
}

- (void)tearDown
{
    // Tear-down code here.
    
    [super tearDown];
}

- (void)testMasterViewControllerDeletesItemsFromTableView
{
    // Test set-up
    
    MasterViewController *controller = [[MasterViewController alloc] init];
    NSIndexPath *dummyIndexPath = [NSIndexPath indexPathWithIndex:3];
    id tableViewMock = [OCMockObject mockForClass:[UITableView class]];
    [[tableViewMock expect] deleteRowsAtIndexPaths:[NSArray arrayWithObject:dummyIndexPath] withRowAnimation:UITableViewRowAnimationFade];
    
    // Invoke functionality to be tested
    // If you want to see the test fail you can, for example, change the editing style to UITableViewCellEditingStyleNone. In
    // that case the method in the controller does not make a call to the table view and the mock will raise an exception when
    // verify is called further down.
    
    [controller tableView:tableViewMock commitEditingStyle:UITableViewCellEditingStyleDelete forRowAtIndexPath:dummyIndexPath];
    
    // Verify that expectations were met
    
    [tableViewMock verify];
}

@end
