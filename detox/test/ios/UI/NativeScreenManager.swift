//
//  NativeScreenManager.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit

@objc enum NativeScreen: Int {
    case customKeyboard = 0

    var viewController: UIViewController {
        switch self {
            case .customKeyboard:
                let vc = CustomKeyboardViewController()
                vc.modalPresentationStyle = .fullScreen
                return vc
        }
    }
}

@objc protocol NativeScreenManaging {
    func handle(_ notification: Notification)
}

@objc(NativeScreenManager)
class NativeScreenManager: NSObject, NativeScreenManaging {
    weak var window: UIWindow?

    @objc init(window: UIWindow?) {
        self.window = window
        super.init()
    }

    // Internal Swift method that uses the enum
    func present(_ screen: NativeScreen, from: UIViewController?, animated: Bool) {
        let presentingVC = from ?? window?.rootViewController
        let viewController = screen.viewController
        presentingVC?.present(viewController, animated: animated)
    }

    @objc func handle(_ notification: Notification) {
        guard let name = notification.userInfo?["name"] as? String else { return }

        switch name {
            case "customKeyboard":
                present(.customKeyboard, from: nil, animated: true)
            default:
                print("Unknown screen: \(name)")
        }
    }
}
