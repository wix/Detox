//
//  DTXAssertionHandler+Swift.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 4/30/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import UIKit

func dtx_try_nothrow(_ block: () -> Void) -> Bool {
	do {
		try DTXAssertionHandler.__try(block)
		return true
	}
	catch {
		return false
	}
}

func dtx_try(_ block: () -> Void) throws {
	try DTXAssertionHandler.__try(block)
}

func dtx_fatalError(_ message: @autoclosure () -> String, view: @autoclosure () -> UIView? = nil, function: String = #function, file: String = #file, line: UInt = #line) -> Never {
	DTXAssertionHandler.handleFailure(inFunction: function, file: file, lineNumber: Int(line), view: view(), description: message(), arguments: getVaList([]))
	abort()
}

func dtx_assert(_ condition: @autoclosure () -> Bool, _ message: @autoclosure () -> String, view: @autoclosure () -> UIView? = nil, function: String = #function, file: String = #file, line: UInt = #line) {
	guard condition() else {
		dtx_fatalError(message(), view: view(), function: function, file: file, line: line)
	}
}
