//
//  AppDelegate+Linking.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit
import React
import CoreSpotlight

// MARK: - URL and Universal Links Handling
extension AppDelegate {
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {
        return RCTLinkingManager.application(app, open: url, options: options)
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        if userActivity.activityType == CSSearchableItemActionType {
            if let identifier = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
               let url = URL(string: "\(identifier)") {

                let customOptions: [UIApplication.OpenURLOptionsKey: Any] = [
                    .sourceApplication: "",
                    .annotation: [:]
                ]

                return RCTLinkingManager.application(application, open: url, options: customOptions)
            } else {
                return false
            }
        }

        return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
