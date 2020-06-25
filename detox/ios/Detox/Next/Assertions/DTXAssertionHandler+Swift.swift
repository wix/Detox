//
//  DTXAssertionHandler+Swift.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 4/30/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import UIKit

@inline(__always)
func dtx_try_nothrow(_ block: () -> Void) -> Bool {
	do {
		try DTXAssertionHandler.__try(block)
		return true
	}
	catch {
		return false
	}
}

@inline(__always)
func dtx_try(_ block: () -> Void) throws {
	try DTXAssertionHandler.__try(block)
}

@inline(__always)
func dtx_fatalError(_ message: @autoclosure () -> String, viewDescription: @autoclosure () -> [String: Any]? = nil, function: String = #function, file: String = #file, line: UInt = #line) -> Never {
	DTXAssertionHandler.handleFailure(inFunction: function, file: file, lineNumber: Int(line), viewDescription: viewDescription(), description: message(), arguments: getVaList([]))
	abort()
}

@inline(__always)
func dtx_assert(_ condition: @autoclosure () -> Bool, _ message: @autoclosure () -> String, viewDescription: @autoclosure () -> [String: Any]? = nil, function: String = #function, file: String = #file, line: UInt = #line) {
	guard condition() else {
		dtx_fatalError(message(), viewDescription: viewDescription(), function: function, file: file, line: line)
	}
}

@inline(__always)
func dtx_errorForFatalError(_ message: @autoclosure () -> String, viewDescription: @autoclosure () -> [String: Any]? = nil, function: String = #function, file: String = #file, line: UInt = #line) -> Error {
	return DTXAssertionHandler.errorForFailure(inFunction: function, file: file, lineNumber: Int(line), viewDescription: viewDescription(), description: message(), arguments: getVaList([]))
}
