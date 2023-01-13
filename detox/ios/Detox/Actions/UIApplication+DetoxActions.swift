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
		let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene
		windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: mask))
		let keyWindow = windowScene?.windows.first { $0.isKeyWindow }
		keyWindow?.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
	}
}
