import UIKit
import React
import UserNotifications
import CoreSpotlight

// MARK: - App Delegate

@UIApplicationMain
@objc(AppDelegate)
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var moduleName: String = "example"
    var initialProps: [String: Any] = [:]
    private var screenManager: NativeScreenManaging?

    // MARK: - UIApplicationDelegate Methods

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        setupReactNative(with: launchOptions)
        setupNotifications()
        setupScreenManager()

        return true
    }

    // MARK: - Setup Methods

    private func setupReactNative(with launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        let bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
        let rootView = RCTRootView(bridge: bridge!,
                                   moduleName: moduleName,
                                   initialProperties: initialProps)
        rootView.backgroundColor = .white

        let rootViewController = UIViewController()
        rootViewController.view = rootView

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = rootViewController
        window?.makeKeyAndVisible()
    }

    private func setupNotifications() {
        UNUserNotificationCenter.current().delegate = self

        NotificationCenter.default.addObserver(
            forName: Notification.Name("ChangeScreen"),
            object: nil,
            queue: nil
        ) { [weak self] notification in
            self?.screenManager?.handle(notification)
        }
    }

    private func setupScreenManager() {
        screenManager = NativeScreenManager(window: window)
    }
}

// MARK: - Shake Gesture Handling

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

// MARK: - URL and Universal Links Handling

extension AppDelegate {
    func application(_ app: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return RCTLinkingManager.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return RCTLinkingManager.application(application,
                                             continue: userActivity,
                                             restorationHandler: restorationHandler)
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.list, .banner, .badge, .sound])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        completionHandler()
    }
}

// MARK: - RCTBridgeDelegate

extension AppDelegate: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge) -> URL? {
        return bundleURL()
    }

    private func bundleURL() -> URL {
#if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index",
                                                                 fallbackExtension: nil)!
#else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")!
#endif
    }
}
