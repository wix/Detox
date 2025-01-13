//
//  NativeScreenManager.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit

enum NativeScreen {
    case customKeyboard

    var viewController: UIViewController {
        switch self {
            case .customKeyboard:
                let vc = CustomKeyboardViewController()
                vc.modalPresentationStyle = .fullScreen
                return vc
        }
    }
}

protocol NativeScreenManaging {
    func present(_ screen: NativeScreen, from: UIViewController?, animated: Bool)
    func handle(_ notification: Notification)
}

class NativeScreenManager: NativeScreenManaging {
    weak var window: UIWindow?

    init(window: UIWindow?) {
        self.window = window
    }

    func present(_ screen: NativeScreen, from: UIViewController?, animated: Bool) {
        let presentingVC = from ?? window?.rootViewController
        let viewController = screen.viewController
        presentingVC?.present(viewController, animated: animated)
    }

    func handle(_ notification: Notification) {
        guard let name = notification.userInfo?["name"] as? String else { return }

        switch name {
            case "customKeyboard":
                present(.customKeyboard, from: nil, animated: true)
            default:
                print("Unknown screen: \(name)")
        }
    }
}
