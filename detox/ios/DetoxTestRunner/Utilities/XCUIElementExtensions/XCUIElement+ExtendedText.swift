//
//  XCUIElement+ExtendedText.swift
//  DetoxTestRunner
//
//  Created by Alon Haiut on 10/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

import Foundation
import XCTest

extension XCUIElement {
	
	func dtx_clearText() -> Void {
		
		if(self.elementType != .textField &&
			self.elementType != .secureTextField &&
			self.elementType != .searchField &&
			self.elementType != .textView)
		{
//			DTXFail("%s is not valid for %@.", #function, self)
			return;
		}

		guard let currentValue = self.value as? String else {
//			DTXFail(@"Tried to clear and enter text into a non string value");
			return;
		}

		let clearTypeText = "".padding(toLength: currentValue.count, withPad: "", startingAt: 0)
		
//		NSString* clearTypeText = [@"" stringByPaddingToLength:currentValue.length withString:XCUIKeyboardKeyDelete startingAtIndex:0];
//		[self typeText:clearTypeText];
		
		self.typeText(clearTypeText)
	}
	
	func dtx_replaceText(_ text: String) -> Void {
		self.dtx_clearText()
		self.typeText(text)
	}
}
