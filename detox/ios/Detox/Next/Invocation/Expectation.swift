//
//  Assertion.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/27/20.
//

import Foundation
import UIKit

fileprivate func applyModifiers(_ input: Bool, modifiers: Set<String>) -> Bool {
	var rv = input
	
	modifiers.forEach {
		switch $0 {
		case Modifier.not:
			rv = !rv
		default:
			fatalError("Unimplemented modifier “\($0)”")
			break
		}
	}
	
	return rv
}

class Expectation : CustomStringConvertible {
	struct Keys {
		static let kind = "expectation"
		static let params = "params"
		static let predicate = "predicate"
		static let modifiers = "modifiers"
		static let timeout = "timeout"
	}
	
	struct Kind {
		static let toBeVisible = "toBeVisible"
		static let toExist = "toExist"
		static let toHaveText = "toHaveText"
		static let toHaveLabel = "toHaveLabel"
		static let toHaveId = "toHaveId"
		static let toHaveValue = "toHaveValue"
		static let toHavePlaceholderValue = "toHavePlaceholderValue"
	}
	
	let element : Element
	let kind : String
	let modifiers : Set<String>
	let timeout : TimeInterval
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval) {
		self.element = element
		self.kind = kind
		self.modifiers = modifiers
		self.timeout = timeout
	}
	
	static let mapping : [String: Expectation.Type] = [
		Kind.toBeVisible: ToBeVisibleExpectation.self,
		Kind.toExist: ToExistExpectation.self,
		
		Kind.toHaveText: ValueExpectation.self,
		Kind.toHaveLabel: ValueExpectation.self,
		Kind.toHaveId: ValueExpectation.self,
		Kind.toHaveValue: ValueExpectation.self,
		Kind.toHavePlaceholderValue: ValueExpectation.self
	]
	
	static let keyMapping : [String: String] = [
		Kind.toHaveText: "text",
		Kind.toHaveLabel: "accessibilityLabel",
		Kind.toHaveId: "accessibilityIdentifier",
		Kind.toHaveValue: "accessibilityValue",
		Kind.toHavePlaceholderValue: "placeholder"
	]
	
	class func with(dictionaryRepresentation: [String: Any]) -> Expectation {
		let kind = dictionaryRepresentation[Keys.kind] as! String //crash on failure
		let params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible]?
		let modifiers : Set<String>
		if let modifiersInput = dictionaryRepresentation[Keys.modifiers] as? [String] {
			modifiers = Set<String>(modifiersInput)
		} else {
			modifiers = []
		}
		//Convert ms to seconds
		let timeout = ((dictionaryRepresentation[Keys.timeout] as! TimeInterval?) ?? 0.0).fromMSToSeconds()
		
		let element = Element.with(dictionaryRepresentation: dictionaryRepresentation)
		let expectationClass = mapping[kind]!
		if expectationClass == ValueExpectation.self {
			return ValueExpectation(kind: kind, modifiers: modifiers, element: element, timeout: timeout, key: keyMapping[kind]!, value: params!.first!)
		} else {
			return expectationClass.init(kind: kind, modifiers: modifiers, element: element, timeout: timeout)
		}
	}
	
	fileprivate func evaluate(with view: UIView) -> Bool {
		fatalError("Unimplemented perform(on:) called for \(type(of: self))")
	}
	
	fileprivate func _evaluate() {
		let view = self.element.view
		dtx_assert(applyModifiers(evaluate(with: view), modifiers: modifiers), "Failed expectation: \(self.description)", view: view)
	}
	
	func evaluate() {
		guard timeout != 0.0 else {
			_evaluate()
			return
		}
		
		let startDate = Date()
		var timedOut = false
		
		let spinner = DTXRunLoopSpinner()
		spinner.timeout = Double.greatestFiniteMagnitude
		spinner.minRunLoopDrains = 0
		spinner.maxSleepInterval = Double.greatestFiniteMagnitude
		spinner.spin { () -> Bool in
			if startDate.timeIntervalSince(Date()) > timeout {
				timedOut = true
				return true
			}
			
			return (try? dtx_try {
				_evaluate()
			}) == false
		}
		
		dtx_assert(!timedOut, "Timed out for expectation: \(self.description)", view: nil)
	}
	
	fileprivate var additionalDescription: String {
		get {
			return ""
		}
	}
	
	var description: String {
		get {
			return String(format: "%@%@%@ WITH %@%@", modifiers.contains(Modifier.not) ? "NOT " : "", self.kind.uppercased(), additionalDescription, element.description, timeout > 0.0 ? " TIMEOUT(\(Int(timeout.truncatingRemainder(dividingBy: 1)) * 1000) ms)" : "")
		}
	}
}

class ToBeVisibleExpectation : Expectation {
	override func evaluate(with view: UIView) -> Bool {
		return view.dtx_isVisible
	}
}

class ToExistExpectation : Expectation {
	override func _evaluate() {
		dtx_assert(applyModifiers(self.element.exists, modifiers: modifiers), "Failed expectation: \(self.description)")
	}
}

class ValueExpectation : Expectation {
	let key : String
	let value : CustomStringConvertible
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval, key: String, value: CustomStringConvertible) {
		self.key = key
		self.value = value
		
		super.init(kind: kind, modifiers: modifiers, element: element, timeout: timeout)
	}
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval) {
		fatalError("Call the other initializer")
	}
	
	override func evaluate(with view: UIView) -> Bool {
		return NSComparisonPredicate(leftExpression: NSExpression(forKeyPath: key), rightExpression: NSExpression(forConstantValue: value), modifier: .direct, type: .equalTo, options: []).evaluate(with: view)
	}
	
	override var additionalDescription: String {
		get {
			return "(\(key) == “\(value)”)"
		}
	}
}
