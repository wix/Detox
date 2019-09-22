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

- (void)setUp {
    // Put setup code here. This method is called before the invocation of each test method in the class.

    // In UI tests it is usually best to stop immediately when a failure occurs.
    self.continueAfterFailure = YES;

    // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
}

- (void)testExample {
    // UI tests must launch the application that they test.
//    DTXDetoxApplication *app = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.LeoNatan.XCUITestTest"];
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
	[textField typeText:@"Hello World!"];
	[textField typeText:XCUIKeyboardKeyReturn];
	
	[picker ln_adjustToDatePickerDate:[NSDate dateWithTimeIntervalSinceNow:86400 * 1000 - 48200]];
//	[picker ln_adjustToCountDownDuration:27900];
}

@end
