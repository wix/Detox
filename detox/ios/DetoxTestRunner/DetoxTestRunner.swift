//
//  DetoxTestRunner.swift
//  DetoxTestRunner
//
//  Created by Alon Haiut on 10/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

import XCTest

class DetoxTestRunner: XCTestCase, WebSocketDelegate, DTXDetoxApplicationDelegate {
	
	var webSocket: WebSocket
	var _testedApplication: DTXDetoxApplication
	var _testedApplicationInvocationManager: InvocationManager
	
	var pendingActions: NSMutableArray
	var _pendingActionsMutex: pthread_mutex_t
//	var _pendingActionsAvailable: dispatch_semaphore_t
	
	class func defaultTestSuite() -> XCTestSuite {
		let rv = XCTestSuite.init(name: "Detox Test Suite")
		rv.addTest(DetoxTestRunner.init(selector: Selector(testDetoxSuite)))
		return rv
	}
	

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testExample() throws {
        // UI tests must launch the application that they test.
        let app = XCUIApplication()
        app.launch()

        // Use recording to get started writing UI tests.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
    }

    func testLaunchPerformance() throws {
        if #available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 7.0, *) {
            // This measures how long it takes to launch your application.
            measure(metrics: [XCTApplicationLaunchMetric()]) {
                XCUIApplication().launch()
            }
        }
    }
	
	func testDetoxSuite() {
		NSLog("*********************************************************\nArguments: %@\n*********************************************************", ProcessInfo.processInfo.arguments);
		
	//	_testedApplication = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.apple.mobilesafari"];
	//	_testedApplication = [[DTXDetoxApplication alloc] initWithBundleIdentifier:@"com.wix.ExampleApp"];
		//TODO: Obtain application bundle identifier from environment variables or launch arguments.
		_testedApplication = DTXDetoxApplication()
		_testedApplication.delegate = self;
		_testedApplicationInvocationManager = InvocationManager(application: _testedApplication)
		
	//	[self webSocket:nil didReceiveAction:@"launch" withParams:nil withMessageId:@10];
	//	[self webSocket:nil didReceiveAction:@"invoke" withParams:[NSDictionary dictionaryWithContentsOfURL:[[NSBundle bundleForClass:DetoxTestRunner.class] URLForResource:@"tap-bad" withExtension:@"plist"]] withMessageId:@1];
	//	[self webSocket:nil didReceiveAction:@"launch" withParams:nil withMessageId:@10];
	//	[self webSocket:nil didReceiveAction:@"invoke" withParams:[NSDictionary dictionaryWithContentsOfURL:[[NSBundle bundleForClass:DetoxTestRunner.class] URLForResource:@"tap" withExtension:@"plist"]] withMessageId:@2];
		
		repeat {
			let action = self._dequeueAction();
			action();
		}
		while (true);
	}
	
	func _dequeueAction() -> (() -> Void) {
//	 dispatch_semaphore_wait(_pendingActionsAvailable, DISPATCH_TIME_FOREVER);
//	 pthread_mutex_lock(&_pendingActionsMutex);
//	 dispatch_block_t action = _pendingActions.firstObject;
//	 [_pendingActions removeObjectAtIndex:0];
//	 pthread_mutex_unlock(&_pendingActionsMutex);
//
//	 return action;
 }
}

