//
//  UNApiAppDelegate.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 05/02/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

import UIKit
import UserNotifications

@available(iOS 10.0, *)
class UNApiAppDelegate: LegacyApiAppDelegate, UNUserNotificationCenterDelegate {
	override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey : Any]?) -> Bool {
		UNUserNotificationCenter.current().delegate = self
		
		return super.application(application, didFinishLaunchingWithOptions: launchOptions)
	}
	
	func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Swift.Void) {
		userNotificationAPIWasCalled = true
		userNotificationTriggerType = TestableAppDelegate.triggerType(from: response)
		userNotificationTitle = response.notification.request.content.title
	}
}
