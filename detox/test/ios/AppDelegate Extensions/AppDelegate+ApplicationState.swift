//
//  AppDelegate+ApplicationState.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit

extension AppDelegate {
    func setupApplicationStateObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
    }

    @objc private func applicationDidBecomeActive() {
        showOverlayMessage(withMessage: "Active")
    }

    @objc private func applicationWillResignActive() {
        showOverlayMessage(withMessage: "Inactive")
    }

    @objc private func applicationDidEnterBackground() {
        showOverlayMessage(withMessage: "Background")
    }
}
