//
//  AppDelegate+OverlayView.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit
import React

@objc extension AppDelegate {
    private var overlayStackView: UIStackView? {
        guard
            let rootView = window.rootViewController?.view as? RCTRootView,
            let contentView = rootView.value(forKey: "contentView") as? UIView
        else {
            return nil
        }

        return contentView.subviews.compactMap { $0 as? UIStackView }
            .first { $0.accessibilityIdentifier == "overlayStackView" }
    }

    private func createOverlayStackView(in contentView: UIView) -> UIStackView {
        let stackView = UIStackView()
        stackView.axis = .vertical
        stackView.distribution = .equalSpacing
        stackView.spacing = 8
        stackView.translatesAutoresizingMaskIntoConstraints = false

        stackView.accessibilityIdentifier = "overlayStackView"

        contentView.addSubview(stackView)

        NSLayoutConstraint.activate([
            stackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            stackView.topAnchor.constraint(equalTo: contentView.safeAreaLayoutGuide.topAnchor)
        ])

        return stackView
    }

    @objc public func showOverlayMessageWithMessage(_ message: String) {
        guard
            let rootView = window.rootViewController?.view as? RCTRootView,
            let contentView = rootView.value(forKey: "contentView") as? UIView
        else {
            return
        }

        let stackView = overlayStackView ?? createOverlayStackView(in: contentView)
        let messageView = OverlayMessageView(message: message)

        stackView.addArrangedSubview(messageView)
        contentView.bringSubviewToFront(stackView)
    }
}
