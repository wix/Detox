//
//  NativeModule.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import React
import UIKit

@objc(NativeModule)
class NativeModule: NSObject, RCTBridgeModule {

    // MARK: - Properties

    var overlayWindow: UIWindow?
    var overlayView: UIView?
    var callCounter: Int = 0

    // MARK: - RCTBridgeModule

    static func moduleName() -> String! {
        return "NativeModule"
    }

    static func requiresMainQueueSetup() -> Bool {
        // Indicates that the module must be initialized on the main thread
        return true
    }

    // MARK: - Lifecycle Methods

    override init() {
        super.init()
        self.callCounter = 0
    }

    // MARK: - Echo Methods

    @objc
    func echoWithoutResponse(_ str: String) {
        self.callCounter += 1
    }

    @objc
    func echoWithResponse(_ str: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.callCounter += 1
        resolve(str)
    }

    // MARK: - Timing Methods

    @objc
    func nativeSetTimeout(_ delay: TimeInterval,
                          block: @escaping RCTResponseSenderBlock) {
        let dispatchTime = DispatchTime.now() + delay
        DispatchQueue.global(qos: .default).asyncAfter(deadline: dispatchTime) { [weak self] in
            self?.executeOnMainThread {
                block([])
            }
        }
    }

    // MARK: - Navigation Methods

    @objc
    func switchToNativeRoot() {
        executeOnMainThread { [weak self] in
            guard let self = self else { return }
            let newRoot = self.createNativeRootViewController()
            self.updateRootViewController(newRoot)
        }
    }

    @objc
    func switchToMultipleReactRoots() {
        executeOnMainThread { [weak self] in
            guard let self = self else { return }
            let tabController = self.createTabBarControllerWithBridge()
            self.updateRootViewController(tabController)
        }
    }

    // MARK: - Notification Methods

    @objc
    func sendNotification(_ notification: String, name: String) {
        executeOnMainThread {
            NotificationCenter.default.post(name: Notification.Name(notification),
                                            object: nil,
                                            userInfo: ["name": name])
        }
    }

    // MARK: - Overlay Methods

    @objc
    func presentOverlayWindow() {
        executeOnMainThread { [weak self] in
            self?.setupAndShowOverlayWindow()
        }
    }

    @objc
    func presentOverlayView() {
        executeOnMainThread { [weak self] in
            self?.setupAndShowOverlayView()
        }
    }

    // MARK: - Private Helper Methods

    private func executeOnMainThread(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async {
                block()
            }
        }
    }

    private func createNativeRootViewController() -> UIViewController {
        let newRoot = UIViewController()
        newRoot.view.backgroundColor = .white

        let label = UILabel()
        label.text = "this is a new native root"
        label.sizeToFit()
        label.center = newRoot.view.center
        newRoot.view.addSubview(label)

        return newRoot
    }

    private func createTabBarControllerWithBridge() -> UITabBarController {
        guard let bridge = getCurrentBridge() else {
            fatalError("RCTBridge is not available")
        }

        let viewControllers = [
            createReactRootViewController(bridge: bridge, title: "1"),
            createReactRootViewController(bridge: bridge, title: "2"),
            createReactRootViewController(bridge: bridge, title: "3"),
            createReactRootViewController(bridge: bridge, title: "4")
        ]

        let tabController = UITabBarController()
        tabController.viewControllers = viewControllers
        return tabController
    }

    private func createReactRootViewController(bridge: RCTBridge, title: String) -> UIViewController {
        let viewController = UIViewController()
        viewController.view = RCTRootView(bridge: bridge, moduleName: "example", initialProperties: nil)
        viewController.tabBarItem.title = title
        return viewController
    }

    private func getCurrentBridge() -> RCTBridge? {
        guard let delegate = UIApplication.shared.delegate as? AppDelegate,
              let window = delegate.window,
              let rootView = window.rootViewController?.view as? RCTRootView else {
            return nil
        }
        return rootView.bridge
    }

    private func updateRootViewController(_ viewController: UIViewController) {
        guard let delegate = UIApplication.shared.delegate as? AppDelegate,
              let window = delegate.window else {
            return
        }
        window.rootViewController = viewController
        window.makeKeyAndVisible()
    }

    private func setupAndShowOverlayWindow() {
        let screenBounds = UIScreen.main.bounds
        overlayWindow = UIWindow(frame: screenBounds)
        overlayWindow?.accessibilityIdentifier = "OverlayWindow"
        overlayWindow?.windowLevel = UIWindow.Level.statusBar
        overlayWindow?.isHidden = false
        overlayWindow?.makeKeyAndVisible()
    }

    private func setupAndShowOverlayView() {
        guard let keyWindow = UIApplication.shared.keyWindow else { return }
        let screenBounds = UIScreen.main.bounds
        overlayView = UIView(frame: screenBounds)
        overlayView?.isUserInteractionEnabled = true
        overlayView?.accessibilityIdentifier = "OverlayView"
        keyWindow.addSubview(overlayView!)
    }
}
