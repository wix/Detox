//
//  UIApplication+DetoxActions.swift
//  Detox
//
//  Created by brent.kelly on 13/01/2023.
//  Copyright © 2023 Wix. All rights reserved.
//

import UIKit

extension UIApplication {
	@available(iOS 16.0, *)
	class func dtx_setOrientation(_ mask: UIInterfaceOrientationMask) {
		let windowScene = UIWindow.dtx_keyWindowScene() as? UIWindowScene
		windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: mask))

		let keyWindow = UIWindow.dtx_keyWindow
		keyWindow?.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
	}
}
