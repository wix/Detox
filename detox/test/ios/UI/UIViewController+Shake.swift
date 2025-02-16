//
//  UIViewController+Shake.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit
import React

extension UIViewController {

    @objc static func swizzleMotionEnded() {
        guard let originalMethod = class_getInstanceMethod(UIViewController.self, #selector(motionEnded(_:with:))),
              let swizzledMethod = class_getInstanceMethod(UIViewController.self, #selector(swizzled_motionEnded(_:with:))
              ) else { return }

        method_exchangeImplementations(originalMethod, swizzledMethod)
    }

    @objc private func swizzled_motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        if motion == .motionShake {
            handleGlobalShakeGesture()
        }

        if self.responds(to: #selector(swizzled_motionEnded(_:with:))) {
            self.swizzled_motionEnded(motion, with: event)
        }
    }


    private func handleGlobalShakeGesture() {
        guard let shakeModule = ShakeEventEmitter.sharedInstance() else {
            return
        }

        shakeModule.handleShake()
    }
}
