//
//  DetoxTestRunner.swift
//  DetoxTestRunner
//
//  Created by Alon Haiut on 10/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

import XCTest

class DetoxTestRunner: XCTestCase, WebSocketDelegate, DTXDetoxApplicationDelegate {
	
	var webSocket = WebSocket()
	var testedApplication: DTXDetoxApplication
	var testedApplicationInvocationManager: InvocationManager
	
	var pendingActions = Array<() -> Void>()
	var pendingActionsMutex: pthread_mutex_t
	var pendingActionsAvailable: DispatchSemaphore
	
	static let _defaultTestSuite: XCTestSuite = initDefaultTestSuite();
	
	
	override class var defaultTestSuite: XCTestSuite {
		return _defaultTestSuite;
	}
	
	override init(selector: Selector) {
		super.init(selector: selector)
		
		pthread_mutex_init(&pendingActionsMutex, nil);
		pendingActionsAvailable = DispatchSemaphore(value: 0)
		
		webSocket.delegate = self
//		self.reconnectWebSocket()
		self.continueAfterFailure = true
	}
	
	
	
	
	// MARK: XCTest methods

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
		testedApplication = DTXDetoxApplication()
		testedApplication.delegate = self;
		testedApplicationInvocationManager = InvocationManager(application: testedApplication)
		
	//	[self webSocket:nil didReceiveAction:@"launch" withParams:nil withMessageId:@10];
	//	[self webSocket:nil didReceiveAction:@"invoke" withParams:[NSDictionary dictionaryWithContentsOfURL:[[NSBundle bundleForClass:DetoxTestRunner.class] URLForResource:@"tap-bad" withExtension:@"plist"]] withMessageId:@1];
	//	[self webSocket:nil didReceiveAction:@"launch" withParams:nil withMessageId:@10];
	//	[self webSocket:nil didReceiveAction:@"invoke" withParams:[NSDictionary dictionaryWithContentsOfURL:[[NSBundle bundleForClass:DetoxTestRunner.class] URLForResource:@"tap" withExtension:@"plist"]] withMessageId:@2];
		
		repeat {
			let action = self.dequeueAction();
			action();
		}
		while (true);
	}
	
	
	// MARK: Private methods

	private class func initDefaultTestSuite() -> XCTestSuite {
		let rv = XCTestSuite.init(name: "Detox Test Suite")
		rv.addTest(DetoxTestRunner.init(selector: #selector(testDetoxSuite)))
		return rv
	}
	
	private func _enqueue(action: @escaping () -> Void) {
		pthread_mutex_lock(&pendingActionsMutex);
		pendingActions.append(action)
		pthread_mutex_unlock(&pendingActionsMutex);
		pendingActionsAvailable.signal();
	}
	
	private func dequeueAction() -> (() -> Void) {
		guard pendingActionsAvailable.wait(timeout: .distantFuture) == .success else {
			NSLog("pendingActionsAvailable timeout distantFuture failed")
			return ({});
		}
		pthread_mutex_lock(&pendingActionsMutex);
		let pendingAction = pendingActions.first
		pendingActions.remove(at: 0)
		pthread_mutex_unlock(&pendingActionsMutex);

		guard let action = pendingAction else {
			return ({});
		}
		
		return action
   }
	
	private func replaceActions(actions: Array<() -> Void>) {
		var needsSignal = false
		pthread_mutex_lock(&pendingActionsMutex);
		pendingActions.removeAll()
		pendingActions.append(contentsOf: actions)
		if actions.count > 0 {
			needsSignal = true;
		}
		pthread_mutex_unlock(&pendingActionsMutex);
		
		if needsSignal {
			pendingActionsAvailable.signal()
		}
	}
	
	private func launchApplication(parameters: Dictionary<String, Any>? ,completionHandler: (() -> Void)?) {
		
		guard let params = parameters, let userActivity = params["userActivity"] as? Dictionary<String, Any>?, let userNotification = params["userNotification"] as? Dictionary<String, Any>? else {
			NSLog("Failed to parse parameters when lunching app")
			completionHandler?()
		}
		
		
		testedApplication.launchUserNotification = userActivity
		testedApplication.launchUserNotification = DetoxUserNotificationParser.parseUserNotification(dict: userNotification)
		
		if let urlString = params["url"] as? String {
			testedApplication.launchOpenURL = URL.init(string: urlString)
		}
		
		if let sourceApp = params["sourceApp"] as? String {
			testedApplication.launchSourceApp = sourceApp
		}
		
		if let launchArgs = params["launchArgs"] as? [String] {
			testedApplication.launchArguments = launchArgs
		}
	
		
		if let newInstance = params["newInstance"] as? Bool, newInstance == true {
			testedApplication.launch()
		} else {
			testedApplication.activate()
		}
		
		completionHandler?()

	}
	
	private func terminateApplication(parameters: Dictionary<String, Any>? ,completionHandler: (() -> Void)?) {
		testedApplication.terminate()
		completionHandler?()
	}
	
	private func cleanupActionsQueueAndTerminateIfNeeded() {
		replaceActions(actions: [])
		cleanUpAndTerminateIfNeeded()
	}
	
	private func cleanUpAndTerminateIfNeeded() {
		//The web socket connection closed, so terminate all tested applications and finally exist the process.
		testedApplication.detoxHelper.stopAndCleanupRecording(completionHandler: {})
		//Only terminated tested app if debugger is not attached.
		testedApplication.detoxHelper.isDebuggerAttached { [weak self] isDebuggerAttached in
			if !isDebuggerAttached {
				self?.terminateApplication(parameters: nil, completionHandler: nil)
			}
		}
		
		
		//Only exist test runner process if debugger is not attached.
		//TODO: Fix the debugger scope. For now just exist
		exit(0);
//		if(Detox DTXIsDebuggerAttached() == false)
//		{
//			exit(0);
//		}
	}
}

