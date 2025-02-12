//
//  AppDelegate+OverlayView.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit
import React

@objc extension AppDelegate {
    private var overlayStackView: UIStackView? {
        return window.rootViewController?.view.subviews
            .compactMap { $0 as? UIStackView }
            .first { $0.accessibilityIdentifier == "overlayStackView" }
    }

    private func getTargetView(from rootView: UIView) -> UIView {
        if let contentView = rootView.value(forKey: "contentView") as? UIView {
            return contentView
        }
        return rootView
    }

    private func createOverlayStackView(in view: UIView) -> UIStackView {
        let stackView = UIStackView()
        stackView.axis = .vertical
        stackView.distribution = .fillEqually
        stackView.spacing = 8
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.accessibilityIdentifier = "overlayStackView"

        stackView.layoutMargins = UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16)
        stackView.isLayoutMarginsRelativeArrangement = true

        view.addSubview(stackView)

        NSLayoutConstraint.activate([
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            stackView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
        ])

        return stackView
    }

    @objc public func showOverlayMessageWithMessage(_ message: String) {
        DispatchQueue.main.async {
            guard let rootView = self.window.rootViewController?.view else { return }

            let targetView = self.getTargetView(from: rootView)
            let stackView = self.overlayStackView ?? self.createOverlayStackView(in: targetView)

            stackView.layer.zPosition = 999

            if let existingMessageView = self.findExistingMessageView(withMessage: message, in: stackView) {
                existingMessageView.resetTimer()
            } else {
                let messageView = OverlayMessageView(message: message)
                stackView.addArrangedSubview(messageView)

                // Optional: Remove older messages if we have too many
                if stackView.arrangedSubviews.count > 3 {
                    stackView.arrangedSubviews.first?.removeFromSuperview()
                }
            }

            targetView.bringSubviewToFront(stackView)
        }
    }

    private func findExistingMessageView(withMessage message: String, in stackView: UIStackView) -> OverlayMessageView? {
        return stackView.arrangedSubviews.compactMap { $0 as? OverlayMessageView }
            .first { $0.message == message }
    }
}
