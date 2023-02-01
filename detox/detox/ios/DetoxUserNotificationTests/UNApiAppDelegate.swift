//
//  UNApiAppDelegate.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 05/02/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

import UIKit
import UserNotifications

@objc(UNApiAppDelegate)
class UNApiAppDelegate: TestableAppDelegate, UNUserNotificationCenterDelegate {
	var userNotificationWillPresentWasCalled = false
	var userNotificationdidReceiveWasCalled = false
	var swallowActiveUserNotification = false
	
	override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]?) -> Bool {
		UNUserNotificationCenter.current().delegate = self
		
		return super.application(application, didFinishLaunchingWithOptions: launchOptions)
	}
	
	private func markUNApiCalled(notification: UNNotification) {
		userNotificationAPIWasCalled = true
		userNotificationTriggerType = TestableAppDelegate.triggerType(from: notification)
		userNotificationTitle = notification.request.content.title
	}
	
	func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
		userNotificationWillPresentWasCalled = true
		markUNApiCalled(notification: notification)
		
		if swallowActiveUserNotification {
			completionHandler([])
		} else {
			completionHandler([.alert, .badge, .sound])
		}
	}
	
	func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Swift.Void) {
		userNotificationdidReceiveWasCalled = true
		markUNApiCalled(notification: response.notification)
	}
}
