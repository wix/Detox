//
//  TestableAppDelegate.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 05/02/2017.
//  Copyright © 2017 Leo Natan. All rights reserved.
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

class TestableAppDelegate: NSObject, UIApplicationDelegate {
	var localNotificationObjectWasFoundInWillLaunch = false
	var remoteNotificationObjectWasFoundInWillLaunch = false
	var localNotificationObjectWasFoundInDidLaunch = false
	var remoteNotificationObjectWasFoundInDidLaunch = false
	
	var legacyLocalNotificationAPIWasCalled = false
	var legacyRemoteNotificationAPIWasCalled = false
	var legacyRemoteNotificationOS7APIWasCalled = false
	var legacyLocalNotificationWithActionAPIWasCalled = false
	var legacyRemoteNotificationWithActionAPIWasCalled = false
	var userNotificationAPIWasCalled = false
	
	var userNotificationTriggerType = TestableAppDelegateNotifcationTriggerType.unknown
	var userNotificationTitle : String?
	
	func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey : Any]? = nil) -> Bool {
		localNotificationObjectWasFoundInWillLaunch = launchOptions?[.localNotification] != nil
		remoteNotificationObjectWasFoundInWillLaunch = launchOptions?[.remoteNotification] != nil
		return true
	}
	
	func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey : Any]? = nil) -> Bool {
		localNotificationObjectWasFoundInDidLaunch = launchOptions?[.localNotification] != nil
		remoteNotificationObjectWasFoundInDidLaunch = launchOptions?[.remoteNotification] != nil
		
		if remoteNotificationObjectWasFoundInDidLaunch {
			userNotificationTriggerType = .push
			userNotificationTitle = ((launchOptions?[.remoteNotification] as! NSDictionary).value(forKeyPath: "aps.alert.title") as! String)
		}
		
		return true
	}
	
	public func application(_ application: UIApplication, didReceive notification: UILocalNotification) {
		legacyLocalNotificationAPIWasCalled = true
		userNotificationTriggerType = TestableAppDelegate.triggerType(from: notification)
		userNotificationTitle = notification.alertTitle
	}
	
	public func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any]) {
		legacyRemoteNotificationAPIWasCalled = true
		userNotificationTriggerType = .push
		userNotificationTitle = ((userInfo as NSDictionary).value(forKeyPath: "aps.alert.title") as! String)
	}
}

@available(iOS 10.0, *)
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

extension TestableAppDelegate {
	class func triggerType(from response: UILocalNotification) -> TestableAppDelegateNotifcationTriggerType {
		return response.region != nil ? .location : .calendar
	}
}
