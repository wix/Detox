//
//  DetoxTestRunner.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

#import <XCTest/XCTest.h>
#import "XCUIElement+ExtendedTouches.h"
#import "XCUIElement+UIDatePickerSupport.h"
#import "DTXDetoxApplication.h"

@interface DetoxTestRunner : XCTestCase

@end

@implementation DetoxTestRunner

- (void)setUp
{
    self.continueAfterFailure = YES;
}

- (void)tearDown
{
}

- (void)testDetoxSuite
{
	NSLog(@"*********************************************************\nArguments: %@\n*********************************************************", NSProcessInfo.processInfo.arguments);
	
//	DTXDetoxApplication *app = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.apple.mobilesafari"];
//	DTXDetoxApplication *app = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.wix.ExampleApp"];
	DTXDetoxApplication *app = [[DTXDetoxApplication alloc] init];
	[app launch];
	
	XCUIElement* tableView = app.tables.firstMatch;
	[tableView scrollWithOffset:CGVectorMake(0, -200)];
	[tableView tapAtPoint:CGVectorMake(200, 200)];
	
	XCUIElementQuery* query = [[app.windows.firstMatch descendantsMatchingType:XCUIElementTypeAny] matchingPredicate:[NSPredicate predicateWithFormat:@"label == 'Second'"]];
	XCUIElement* element = query.firstMatch;
	[element tap];
	
	[[app.buttons elementMatchingPredicate:[NSPredicate predicateWithFormat:@"label == 'Second'"]] tap];
	XCUIElement* label = [app.staticTexts elementMatchingPredicate:[NSPredicate predicateWithFormat:@"label == 'Second View'"]];
	XCTAssertTrue(label.exists);
	XCTAssertTrue(label.isHittable);
	
	query = [[app.windows.firstMatch descendantsMatchingType:XCUIElementTypeAny] matchingPredicate:[NSPredicate predicateWithFormat:@"identifier == 'picker'"]];
	XCUIElement* picker = query.firstMatch;
	
	query = [[app.windows.firstMatch descendantsMatchingType:XCUIElementTypeAny] matchingPredicate:[NSPredicate predicateWithFormat:@"identifier == 'TextField'"]];
	XCUIElement* textField = query.firstMatch;
	[textField tap];
	[textField typeText:NSProcessInfo.processInfo.environment[@"DETOX_SERVER_PORT"]];
	[textField typeText:XCUIKeyboardKeyReturn];
	
	[picker ln_adjustToDatePickerDate:[NSDate dateWithTimeIntervalSinceNow:86400 * 1000 - 48200]];
	
	[app terminate];
//	[picker ln_adjustToCountDownDuration:27900];
	
//	[NSThread sleepForTimeInterval:2];
//	[NSRunLoop.currentRunLoop runUntilDate:NSDate.distantFuture];
}

@end
