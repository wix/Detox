//
//  XCUIElement+Visibility.swift
//  DetoxTestRunner
//
//  Created by Alon Haiut on 10/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

import Foundation
import XCTest

extension XCUIElement {
	
	var dtx_isVisible: Bool {
		return self.exists && self.isHittable && self.frame.isEmpty == false;
	}
}
