//
//  AppDelegate+OverlayView.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//


import UIKit
import React

extension AppDelegate {
    func showOverlayMessage(withMessage message: String) {
        guard
            let rootView = window?.rootViewController?.view as? RCTRootView,
            let contentView = rootView.value(forKey: "contentView") as? UIView
        else {
            return
        }

        let messageView = OverlayMessageView(message: message)
        contentView.addSubview(messageView)

        NSLayoutConstraint.activate([
            messageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            messageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            messageView.topAnchor.constraint(equalTo: contentView.safeAreaLayoutGuide.topAnchor),
            messageView.heightAnchor.constraint(equalToConstant: 60)
        ])

        contentView.bringSubviewToFront(messageView)
    }
}

