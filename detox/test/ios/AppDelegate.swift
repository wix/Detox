import UIKit
import React

// MARK: - App Delegate
@UIApplicationMain
@objc(AppDelegate)
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var moduleName: String = "example"
    var initialProps: [String: Any] = [:]
    private var screenManager: NativeScreenManaging?

    // MARK: - UIApplicationDelegate Methods

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        setupReactNative(with: launchOptions)
        setupNotifications()
        setupScreenManager()
        setupApplicationStateObservers()
        setupShakeDetection()

        return true
    }

    // MARK: - Setup Methods

    private func setupReactNative(with launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        let bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
        let rootView = RCTRootView(
            bridge: bridge!,
            moduleName: moduleName,
            initialProperties: initialProps
        )
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

    private func setupShakeDetection() {
        UIViewController.swizzleMotionEnded()
    }
}

// MARK: - RCTBridgeDelegate
extension AppDelegate: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge) -> URL? {
        return bundleURL()
    }

    private func bundleURL() -> URL {
#if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(
            forBundleRoot: "index",
            fallbackExtension: nil
        )!
#else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")!
#endif
    }
}
