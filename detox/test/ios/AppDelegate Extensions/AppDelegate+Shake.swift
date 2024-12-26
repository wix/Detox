//
//  AppDelegate+Shake.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit
import React

extension AppDelegate {
    override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        if motion == .motionShake {
            if let rootView = window?.rootViewController?.view as? RCTRootView {
                let bridge = rootView.bridge
                let shakeModule = bridge.module(for: ShakeEventEmitter.self) as! ShakeEventEmitter
                shakeModule.handleShake()
            }
        } else {
            super.motionEnded(motion, with: event)
        }
    }
}
