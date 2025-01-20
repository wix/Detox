//
//  AppDelegate+Notifications.swift
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UserNotifications
import UIKit
import React

extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {

        completionHandler([.list, .banner, .badge, .sound])

        let title = notification.request.content.title
        showOverlayMessage(withMessage: title)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {

        let title = response.notification.request.content.title
        showOverlayMessage(withMessage: title)

        completionHandler()
    }
}
