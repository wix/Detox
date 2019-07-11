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
	
	func sharedRemoteUserNotificationAssertions(for appDelegate: TestableAppDelegate, dispatcher: DetoxUserNotificationDispatcher, onLaunch: Bool) {
		XCTAssert(dispatcher.remoteNotification != nil)
		_ = appDelegate.application(UIApplication.shared, willFinishLaunchingWithOptions: [.remoteNotification: dispatcher.remoteNotification!])
		_ = appDelegate.application(UIApplication.shared, didFinishLaunchingWithOptions: [.remoteNotification: dispatcher.remoteNotification!])
		dispatcher.dispatch(on: appDelegate, simulateDuringLaunch: onLaunch)
		
		if onLaunch {
			XCTAssert(appDelegate.remoteNotificationObjectWasFoundInWillLaunch)
			XCTAssert(appDelegate.remoteNotificationObjectWasFoundInDidLaunch)
		}
	}
	
	@available(iOS 10.0, *)
	func testUNApiSwallowOnActive() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		UIApplication.shared.applicationState = .active
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		appDelegate.swallowActiveUserNotification = true
		
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: false)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssert(appDelegate.userNotificationWillPresentWasCalled)
		XCTAssertFalse(appDelegate.userNotificationdidReceiveWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
	}
	
	@available(iOS 10.0, *)
	func testUNApiOnInactive() {
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
	
	@available(iOS 10.0, *)
	func testUNApiOnBackground() {
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
	
	@available(iOS 10.0, *)
	func testUNApiWithPushOnLaunch() {
		DTXApplicationMock(nil, "UNApiAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: true)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssertFalse(appDelegate.userNotificationWillPresentWasCalled)
		XCTAssert(appDelegate.userNotificationdidReceiveWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
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
		DTXApplicationMock(nil, "UNApiAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! UNApiAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForCalendarUserNotification)
		
		sharedLocalUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssert(appDelegate.userNotificationAPIWasCalled)
		XCTAssertFalse(appDelegate.legacyLocalNotificationAPIWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .calendar)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From calendar")
	}
	
	func testLegacyApiWithLocalOnLaunch() {
		DTXApplicationMock(nil, "LegacyApiAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! LegacyApiAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForCalendarUserNotification)
		
		sharedLocalUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher)
		
		XCTAssertFalse(appDelegate.userNotificationAPIWasCalled)
		XCTAssert(appDelegate.legacyLocalNotificationAPIWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .calendar)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From calendar")
	}
	
	func testLegacyApiWithPushOnLaunch() {
		DTXApplicationMock(nil, "TestableAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! TestableAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: true)
		
		//It is not called on launch!
		XCTAssertFalse(appDelegate.legacyRemoteNotificationAPIWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
	}
	
	func testLegacyApiOS7WithPushOnLaunch() {
		DTXApplicationMock(nil, "LegacyApiAppDelegate")
		let appDelegate = UIApplication.shared.delegate as! LegacyApiAppDelegate
		let dispatcher = DetoxUserNotificationDispatcher(userNotificationDataUrl: urlForPushUserNotification)
		
		sharedRemoteUserNotificationAssertions(for: appDelegate, dispatcher: dispatcher, onLaunch: true)
		
		XCTAssertFalse(appDelegate.legacyRemoteNotificationAPIWasCalled)
		XCTAssert(appDelegate.legacyRemoteNotificationOS7APIWasCalled)
		XCTAssertEqual(appDelegate.userNotificationTriggerType, .push)
		XCTAssertEqual(appDelegate.userNotificationTitle, "From push")
	}
}
