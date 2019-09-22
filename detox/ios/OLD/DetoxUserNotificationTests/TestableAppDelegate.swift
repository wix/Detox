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

@objc(TestableAppDelegate)
class TestableAppDelegate: NSObject, UIApplicationDelegate {
	var remoteNotificationObjectWasFoundInWillLaunch = false
	var remoteNotificationObjectWasFoundInDidLaunch = false
	
	var userNotificationAPIWasCalled = false
	
	var userNotificationTriggerType = TestableAppDelegateNotifcationTriggerType.unknown
	var userNotificationTitle : String?
	
	func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
		remoteNotificationObjectWasFoundInWillLaunch = launchOptions?[.remoteNotification] != nil
		return true
	}
	
	func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
		remoteNotificationObjectWasFoundInDidLaunch = launchOptions?[.remoteNotification] != nil
		
		if remoteNotificationObjectWasFoundInDidLaunch {
			userNotificationTriggerType = .push
			userNotificationTitle = ((launchOptions?[.remoteNotification] as! NSDictionary).value(forKeyPath: "aps.alert.title") as! String)
		}
		
		return true
	}
}

extension TestableAppDelegate {
	class func triggerType(from notification: UNNotification) -> TestableAppDelegateNotifcationTriggerType {
		switch notification.request.trigger {
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
