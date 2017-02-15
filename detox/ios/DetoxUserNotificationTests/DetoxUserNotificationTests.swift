//
//  DetoxUserNotificationTests.swift
//  DetoxUserNotificationTests
//
//  Created by Leo Natan (Wix) on 05/02/2017.
//  Copyright © 2017 Leo Natan. All rights reserved.
//

import XCTest
@testable import Detox

class DetoxUserNotificationTests: XCTestCase {
	lazy var urlForPushUserNotification : URL = {
		return Bundle(for: DetoxUserNotificationTests.self).url(forResource: "user_notification_push_trigger", withExtension: "json")!
	}()
	
	lazy var urlForCalendarUserNotification : URL = {
		return Bundle(for: DetoxUserNotificationTests.self).url(forResource: "user_notification_calendar_trigger", withExtension: "json")!
	}()
	
    override func setUp() {
        super.setUp()
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
	
	func sharedRemoteUserNotificationAssertions(for appDelegate: TestableAppDelegate, dispatcher: DetoxUserNotificationDispatcher) {
		XCTAssert(dispatcher.remoteNotification != nil)
		_ = appDelegate.application(UIApplication.shared, willFinishLaunchingWithOptions: [.remoteNotification: dispatcher.remoteNotification!])
		_ = appDelegate.application(UIApplication.shared, didFinishLaunchingWithOptions: [.remoteNotification: dispatcher.remoteNotification!])
		dispatcher.dispatch(on: appDelegate, simulateDuringLaunch: true)
		
		XCTAssert(appDelegate.remoteNotificationObjectWasFoundInWillLaunch)
		XCTAssert(appDelegate.remoteNotificationObjectWasFoundInDidLaunch)
	}
	
	@available(iOS 10.0, *)
	func testUNApiWithPushOnLaunch() {
		let appDelegate = UNApiAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .push)
		XCTAssert(appDelegate.userNotificationTitle == "From push")
    }
	
	func sharedLocalUserNotificationAssertions(for appDelegate: TestableAppDelegate, dispatcher: DetoxUserNotificationDispatcher) {
		XCTAssert(dispatcher.localNotification != nil)
		_ = appDelegate.application(UIApplication.shared, willFinishLaunchingWithOptions: [.localNotification: dispatcher.localNotification!])
		_ = appDelegate.application(UIApplication.shared, didFinishLaunchingWithOptions: [.localNotification: dispatcher.localNotification!])
		dispatcher.dispatch(on: appDelegate, simulateDuringLaunch: true)
		
		XCTAssert(appDelegate.localNotificationObjectWasFoundInWillLaunch)
		XCTAssert(appDelegate.localNotificationObjectWasFoundInDidLaunch)
	}
	
	@available(iOS 10.0, *)
	func testUNApiWithCalendarOnLaunch() {
		let appDelegate = UNApiAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForCalendarUserNotification)
		
		sharedLocalUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssertFalse(appDelegate.legacyLocalNotificationAPIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .calendar)
		XCTAssert(appDelegate.userNotificationTitle == "From calendar")
	}
	
	func testLegacyApiWithLocalOnLaunch() {
		let appDelegate = LegacyApiAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForCalendarUserNotification)
		
		sharedLocalUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssertFalse(appDelegate.userNotificationAPIWasCalled)
		XCTAssert(appDelegate.legacyLocalNotificationAPIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .calendar)
		XCTAssert(appDelegate.userNotificationTitle == "From calendar")
	}
	
	func testLegacyApiWithPushOnLaunch() {
		let appDelegate = TestableAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		//It is not called on launch!
		XCTAssertFalse(appDelegate.legacyRemoteNotificationAPIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .push)
		XCTAssert(appDelegate.userNotificationTitle == "From push")
	}
	
	func testLegacyApiOS7WithPushOnLaunch() {
		let appDelegate = LegacyApiAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssertFalse(appDelegate.legacyRemoteNotificationAPIWasCalled)
		XCTAssert(appDelegate.legacyRemoteNotificationOS7APIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .push)
		XCTAssert(appDelegate.userNotificationTitle == "From push")
	}
}
