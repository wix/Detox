//
//  RootViewControllerTests.m
//  iPhoneExample
//
//  Created by Erik Doernenburg on 20/07/10.
//  Copyright 2010 Mulle Kybernetik. All rights reserved.
//

#import <OCMock/OCMock.h>
#import "RootViewControllerTests.h"
#import "RootViewController.h"

/* 
 
	A simple test suite to test the RootViewController. It needs to be run as an "application test" as described
	in the following Apple document. This project is set up following the steps outlined in the document.

	http://developer.apple.com/iphone/library/documentation/xcode/conceptual/iphone_development/135-Unit_Testing_Applications/unit_testing_applications.html

	The first test could be run as a "logic test" but the second test invokes functionality that sets a cell 
	label, which requires instantiation of a font, and that is not possible outside the device/simulator. The 
	following discussion has a bit more detail:

	http://stackoverflow.com/questions/1689586/why-does-instantiating-a-uifont-in-an-iphone-unit-test-cause-a-crash

	As far as I am aware you cannot run the tests in the simulator; at least when I try to run the tests in the
    simulator, the app just launches but there is no output in the debugger window that would indicate the tests
    were run.
 
	The first test should pass but the second test should fail, and you should be able to see something like the 
	following in your device log:

		Test Suite '/var/mobile/Applications/4CEA4E8D-069E-4363-A4B5-E01AF01176CE/iPhoneExample.app/iPhoneExampleTests.octest(Tests)' started at 2010-07-28 10:33:45 +1000
		Test Suite 'RootViewControllerTests' started at 2010-07-28 10:33:45 +1000
		Test Case '-[RootViewControllerTests testControllerReturnsCorrectNumberOfRows]' passed (0.000 seconds).
		Unknown.m:0: error: -[RootViewControllerTests testControllerSetsUpCellCorrectly] : OCMockObject[UITableView]: unexpected method invoked: dequeueReusableCellWithIdentifier:@"Cell" 
		    expected: 	dequeueReusableCellWithIdentifier:@"HelloWorldCell"
		Test Case '-[RootViewControllerTests testControllerSetsUpCellCorrectly]' failed (0.002 seconds).
		Test Suite 'RootViewControllerTests' finished at 2010-07-28 10:33:45 +1000.
		Executed 2 tests, with 1 failure (1 unexpected) in 0.002 (0.006) seconds

	The failure occurs when then RootViewController sends the dequeueReusableCellWithIdentifier: method to the mock
	table view. The mock view is set up to expect that method call with the string "HelloWorldCell" as an argument, 
	but the RootViewController calls the method with just "Cell" as an argument. When you change the identifier in 
	line 75 of the RootViewController to "HelloWorldCell" and re-run the tests, they should both pass.
 
 */


@implementation RootViewControllerTests

- (void)testControllerReturnsCorrectNumberOfRows
{
	RootViewController *controller = [[[RootViewController alloc] initWithStyle:UITableViewStylePlain] autorelease];
	
	STAssertEquals(1, [controller tableView:nil numberOfRowsInSection:0], @"Should have returned correct number of rows.");
}


- (void)testControllerSetsUpCellCorrectly
{
	RootViewController *controller = [[[RootViewController alloc] initWithStyle:UITableViewStylePlain] autorelease];
	id mockTableView = [OCMockObject mockForClass:[UITableView class]];
	[[[mockTableView expect] andReturn:nil] dequeueReusableCellWithIdentifier:@"HelloWorldCell"];
	
	UITableViewCell *cell = [controller tableView:mockTableView cellForRowAtIndexPath:nil];
	
	STAssertNotNil(cell, @"Should have returned a cell");
	STAssertEqualObjects(@"Hello World!", cell.textLabel.text, @"Should have set label");
	[mockTableView verify];
}



@end
