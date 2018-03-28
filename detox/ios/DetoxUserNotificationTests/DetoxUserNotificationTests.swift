//
//  DetoxUserNotificationTests.swift
//  DetoxUserNotificationTests
//
//  Created by Leo Natan (Wix) on 05/02/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

import XCTest
@testable import Detox

class DetoxUserNotificationTests: XCTestCase {
	lazy var urlForPushUserNotification : URL = {
		return Bundle(for: DetoxUserNotificationTests.self).url(forResource: "user_notification_push_trigger", withExtension: "json")!
	}()
	
	lazy var urlForSilentPushUserNotification : URL = {
		return Bundle(for: DetoxUserNotificationTests.self).url(forResource: "user_notification_push_trigger_silent", withExtension: "json")!
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
	
	func testApiWithPush() {
		let appDelegate = TestableAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		dispatcher.dispatch(on: appDelegate)
		
		XCTAssert(dispatcher.remoteNotificationDictionary != nil)
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssertFalse(appDelegate.silentPushAPIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .push)
		XCTAssert(appDelegate.userNotificationTitle == "From push")
    }
	
	func testApiWithSilentPush() {
		let appDelegate = TestableAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForSilentPushUserNotification)
		dispatcher.dispatch(on: appDelegate)
		
		XCTAssertFalse(appDelegate.userNotificationAPIWasCalled)
		XCTAssert(appDelegate.silentPushAPIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .push)
		XCTAssert(appDelegate.userNotificationTitle == nil)
	}
	
	func testApiWithCalendar() {
		let appDelegate = TestableAppDelegate()
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForCalendarUserNotification)
		dispatcher.dispatch(on: appDelegate)
		
		XCTAssert(dispatcher.remoteNotificationDictionary == nil)
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssert(appDelegate.userNotificationTriggerType == .calendar)
		XCTAssert(appDelegate.userNotificationTitle == "From calendar")
	}
}
