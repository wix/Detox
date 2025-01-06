//
//  ShakeEventEmitter.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import React

@objc(ShakeEventEmitter)
class ShakeEventEmitter: RCTEventEmitter {

    static var reactInstance: ShakeEventEmitter? = nil

    override init() {
        super.init()
        ShakeEventEmitter.reactInstance = self
    }

    // MARK: - RCTEventEmitter Overrides

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["ShakeEvent"]
    }

    // MARK: - Public Methods

    @objc
    func handleShake() {
        sendEvent(withName: "ShakeEvent", body: nil)
    }
}
