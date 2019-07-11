//
//  LegacyApiAppDelegate.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 05/02/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

import UIKit

@objc(LegacyApiAppDelegate)
class LegacyApiAppDelegate: TestableAppDelegate {
	func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
		legacyRemoteNotificationOS7APIWasCalled = true
		
		userNotificationTriggerType = .push
		userNotificationTitle = ((userInfo as NSDictionary).value(forKeyPath: "aps.alert.title") as! String)
		
		completionHandler(.newData)
	}
}
