//
//  XCUIElement+ExtendedTouches.swift
//  DetoxTestRunner
//
//  Created by Alon Haiut on 10/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

import Foundation
import XCTest

extension XCUIElement {
	
	func dtx_tap(atPoint point: CGVector) -> Void {
		self.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.0)).dtx_tap(atPoint: point)
	}
	
	func dtx_scroll(withOffset offset: CGVector) -> Void {
		self.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).dtx_scroll(withOffset: offset)

	}
}


extension XCUICoordinate {
	
	func dtx_tap(atPoint point: CGVector) -> Void {
		self.withOffset(point).tap()
	}
	
	func dtx_scroll(withOffset offset: CGVector) -> Void {
		let target = self.withOffset(offset)
		self.press(forDuration: 0.0, thenDragTo: target)
	}
		
}
