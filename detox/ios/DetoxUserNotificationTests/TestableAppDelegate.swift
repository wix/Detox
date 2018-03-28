//
//  TestableAppDelegate.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 05/02/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

import UIKit
import UserNotifications

enum TestableAppDelegateNotifcationTriggerType {
	case unknown
	case push
	case calendar
	case location
	case timeInterval
}

class TestableAppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
	
	var userNotificationAPIWasCalled = false
	var silentPushAPIWasCalled = false
	
	var userNotificationTriggerType = TestableAppDelegateNotifcationTriggerType.unknown
	var userNotificationTitle : String?
	
	override init() {
		super.init()
		UNUserNotificationCenter.current().delegate = self
	}
	
	func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Swift.Void) {
		userNotificationAPIWasCalled = true
		userNotificationTriggerType = TestableAppDelegate.triggerType(from: response)
		userNotificationTitle = response.notification.request.content.title
	}
	
	func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
		silentPushAPIWasCalled = true
		userNotificationTriggerType = .push
		userNotificationTitle = nil
	}
}

extension TestableAppDelegate {
	class func triggerType(from response: UNNotificationResponse) -> TestableAppDelegateNotifcationTriggerType {
		switch response.notification.request.trigger {
		case is UNPushNotificationTrigger:
			return .push
		case is UNTimeIntervalNotificationTrigger:
			return .timeInterval
		case is UNCalendarNotificationTrigger:
			return .calendar
		case is UNLocationNotificationTrigger:
			return .location
		default:
			return .unknown
		}
	}
}
