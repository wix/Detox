//
//  AppDelegate.swift
//  TouchVisualizer
//
//  Created by Joseph Blau on 5/18/15.
//  Copyright (c) 2015 Conopsys. All rights reserved.
//

import UIKit
import COSTouchVisualizer

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, COSTouchVisualizerWindowDelegate {

    internal var window: UIWindow? = {
        let customWindow = COSTouchVisualizerWindow(frame: UIScreen.main.bounds)
        
        customWindow.fillColor = UIColor.purple
        customWindow.strokeColor = UIColor.blue
        customWindow.touchAlpha = 0.4;
        
        customWindow.rippleFillColor = UIColor.purple
        customWindow.rippleStrokeColor = UIColor.blue
        customWindow.touchAlpha = 0.1;
        
        return customWindow
        }()

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        guard let window = window as? COSTouchVisualizerWindow else {
            return false
        }
        window.touchVisualizerWindowDelegate = self
        return true
    }
    
    // MARK: - COSTouchVisualizerWindowDelegate

    func touchVisualizerWindowShouldAlwaysShowFingertip(_ window: COSTouchVisualizerWindow!) -> Bool {
        // Return YES to make the fingertip always display even if there's no any mirrored screen.
        // Return NO or don't implement this method if you want to keep the fingertip display only when
        // the device is connected to a mirrored screen.
        return true
    }

    func touchVisualizerWindowShouldShowFingertip(_ window: COSTouchVisualizerWindow!) -> Bool {
        // Return YES or don't implement this method to make this window show fingertip when necessary.
        // Return NO to make this window not to show fingertip.
        return true
    }
}
