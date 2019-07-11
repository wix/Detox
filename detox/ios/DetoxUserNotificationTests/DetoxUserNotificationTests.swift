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
	
	func sharedLocalUserNotificationAssertions(for appDelegate: TestableAppDelegate, dispatcher: DetoxUserNotificationDispatcher) {
		_ = appDelegate.application(UIApplication.shared, willFinishLaunchingWithOptions: [:])
		_ = appDelegate.application(UIApplication.shared, didFinishLaunchingWithOptions: [:])
		dispatcher.dispatch(on: appDelegate, simulateDuringLaunch: true)
	}
	
	func sharedRemoteUserNotificationAssertions(for appDelegate: TestableAppDelegate, dispatcher: DetoxUserNotificationDispatcher, onLaunch: Bool) {
		XCTAssertTrue(dispatcher.remoteNotificationDictionary != nil)
		_ = appDelegate.application(UIApplication.shared, willFinishLaunchingWithOptions: [.remoteNotification: dispatcher.remoteNotificationDictionary!])
		_ = appDelegate.application(UIApplication.shared, didFinishLaunchingWithOptions: [.remoteNotification: dispatcher.remoteNotificationDictionary!])
		dispatcher.dispatch(on: appDelegate, simulateDuringLaunch: onLaunch)
		
		if onLaunch {
			XCTAssertTrue(appDelegate.remoteNotificationObjectWasFoundInWillLaunch)
			XCTAssertTrue(appDelegate.remoteNotificationObjectWasFoundInDidLaunch)
		}
	}
	
	func testUNApiSwallowOnActive() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		UIApplication.shared.applicationState = .active
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		appDelegate.swallowActiveUserNotification = true
		
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: false)
		
		XCTAssertTrue(appDelegate.userNotificationAPIWasCalled)
		XCTAssertTrue(appDelegate.userNotificationWillPresentWasCalled)
		XCTAssertFalse(appDelegate.userNotificationdidReceiveWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
	}
	
	func testUNApiDoesntSwallowOnInactive() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		UIApplication.shared.applicationState = .inactive
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		appDelegate.swallowActiveUserNotification = true
		
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: false)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssertFalse(appDelegate.userNotificationWillPresentWasCalled)
		XCTAssert(appDelegate.userNotificationdidReceiveWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
	}
	
	func testUNApiDoesntSwallowOnBackground() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		UIApplication.shared.applicationState = .background
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		appDelegate.swallowActiveUserNotification = true
		
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: false)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssertFalse(appDelegate.userNotificationWillPresentWasCalled)
		XCTAssert(appDelegate.userNotificationdidReceiveWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
	}
	
	func testUNApiWithPushOnLaunch() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: true)
		
		XCTAssertTrue(appDelegate.userNotificationAPIWasCalled)
		XCTAssertFalse(appDelegate.userNotificationWillPresentWasCalled)
		XCTAssertTrue(appDelegate.userNotificationdidReceiveWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
	}
	
	func testUNApiWithCalendarOnLaunch() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForCalendarUserNotification)
		
		sharedLocalUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .calendar)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From calendar")
	}
	
	func testLegacyApiWithLocalOnLaunch() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! TestableAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForCalendarUserNotification)
		
		sharedLocalUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssertTrue(appDelegate.userNotificationAPIWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .calendar)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From calendar")
	}
}
