//
//  AppDelegate.swift
//  example
//
//  Created by Mark de Vocht on 28/09/2025.
//  Copyright © 2025 Wix. All rights reserved.
//

import UIKit
import React
import UserNotifications
import CoreSpotlight
import React_RCTAppDelegate
import ReactAppDependencyProvider

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

    override func sourceURL(for bridge: RCTBridge) -> URL? {
        return bundleURL()
    }
    
    override func bundleURL() -> URL? {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}

@objc(AppDelegate)
class AppDelegate: NSObject, UIApplicationDelegate {
    
    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?
    
    var screenManager: Any?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        self.reactNativeDelegate = ReactNativeDelegate()
        self.reactNativeFactory = RCTReactNativeFactory(delegate: self.reactNativeDelegate!)
        
        if let dependencyProviderClass = NSClassFromString("RCTAppDependencyProvider") as? NSObject.Type {
            let dependencyProvider = dependencyProviderClass.init()
            self.reactNativeDelegate?.setValue(dependencyProvider, forKey: "dependencyProvider")
        }
        
        self.window = UIWindow(frame: UIScreen.main.bounds)
        self.reactNativeFactory?.startReactNative(withModuleName: "example",
                                                  in: self.window!,
                                                  launchOptions: launchOptions)
        
        setupNotifications()
        setupScreenManager()
        setupApplicationStateObservers()
        
        UIViewController.swizzleMotionEnded()
        
        return true
    }
    
    // MARK: - Setup Methods (ported from Objective-C)
    
    private func setupNotifications() {
        UNUserNotificationCenter.current().delegate = self
        let options: UNAuthorizationOptions = [.alert, .sound, .badge]
        UNUserNotificationCenter.current().requestAuthorization(options: options) { granted, error in
            print("Notification permission granted: \(granted)")
        }
    }
    
    private func setupScreenManager() {
        self.screenManager = NativeScreenManager(window: self.window)
    }
    
    private func setupApplicationStateObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleApplicationDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleApplicationWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleApplicationDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
    }
    
    // MARK: - Application State Observers
    
    @objc private func handleApplicationDidBecomeActive(_ notification: Notification) {
        showOverlayMessage_(message: "Active")
    }
    
    @objc private func handleApplicationWillResignActive(_ notification: Notification) {
        showOverlayMessage_(message: "Inactive")
    }
    
    @objc private func handleApplicationDidEnterBackground(_ notification: Notification) {
        showOverlayMessage_(message: "Background")
    }
    
    // MARK: - URL Handling
    
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return RCTLinkingManager.application(app, open: url, options: options)
    }
    
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    // MARK: - Detox Testing Support
    
    @objc func showOverlayMessage_(message: String) {
        if let overlayViewClass = NSClassFromString("OverlayMessageView") as? NSObject.Type {
            let overlayView = overlayViewClass.init()
            overlayView.setValue(message, forKey: "message")
        }
        print("Overlay message: \(message)")
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        showOverlayMessage_(message: notification.request.content.title)
        if #available(iOS 14.0, *) {
            completionHandler([.list, .banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        showOverlayMessage_(message: response.notification.request.content.title)
        completionHandler()
    }
}
