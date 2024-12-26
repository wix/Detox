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
        showInAppNotification(withTitle: title)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {

        let title = response.notification.request.content.title
        showInAppNotification(withTitle: title)

        completionHandler()
    }
}

// MARK: - Private Helpers

extension AppDelegate {

    /// Displays the custom in-app notification banner on top of the React Native content view
    private func showInAppNotification(withTitle title: String) {

        let bannerView = InAppNotificationView(title: title)

        guard
            let rootView = window?.rootViewController?.view as? RCTRootView,
            let contentView = rootView.value(forKey: "contentView") as? UIView
        else {
            return
        }

        contentView.addSubview(bannerView)

        NSLayoutConstraint.activate([
            bannerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            bannerView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            bannerView.topAnchor.constraint(equalTo: contentView.safeAreaLayoutGuide.topAnchor),
            bannerView.heightAnchor.constraint(equalToConstant: 60)
        ])

        contentView.bringSubviewToFront(bannerView)
    }
}
