//
//  Assertion.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/27/20.
//

import Foundation
import UIKit

@inline(__always)
@discardableResult
fileprivate func async_expectation_dtx_try(completionHandler: @escaping (Error?) -> Void, blockToTry: () -> Void) -> Bool {
	do {
		try dtx_try(blockToTry)
	} catch {
		completionHandler(error)
		return false
	}
	
	return true
}

@inline(__always)
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
		static let toBeFocused = "toBeFocused"
		static let toExist = "toExist"
		static let toHaveText = "toHaveText"
		static let toHaveLabel = "toHaveLabel"
		static let toHaveId = "toHaveId"
		static let toHaveValue = "toHaveValue"
		static let toHavePlaceholder = "toHavePlaceholder"
		static let toHaveSliderPosition = "toHaveSliderPosition"
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
		Kind.toBeFocused: ToBeFocusedExpectation.self,
		Kind.toExist: ToExistExpectation.self,
		
		Kind.toHaveText: ValueExpectation.self,
		Kind.toHaveLabel: ValueExpectation.self,
		Kind.toHaveId: ValueExpectation.self,
		Kind.toHaveValue: ValueExpectation.self,
		Kind.toHavePlaceholder: ValueExpectation.self,
		Kind.toHaveSliderPosition: SliderPositionExpectation.self
	]
	
	static let keyMapping : [String: String] = [
		Kind.toHaveText: "text",
		Kind.toHaveLabel: "label",
		Kind.toHaveId: "identifier",
		Kind.toHaveValue: "value",
		Kind.toHavePlaceholder: "placeholder",
	]
	
	class func with(dictionaryRepresentation: [String: Any]) throws -> Expectation {
		let kind = dictionaryRepresentation[Keys.kind] as! String //crash on failure
		let params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible]?
		let modifiers : Set<String>
		if let modifiersInput = dictionaryRepresentation[Keys.modifiers] as? [String] {
			modifiers = Set<String>(modifiersInput)
		} else {
			modifiers = []
		}
		//Convert ms to seconds
		let timeout = ((dictionaryRepresentation[Keys.timeout] as! Double?) ?? 0.0).toSeconds()
		
		let element = try Element.with(dictionaryRepresentation: dictionaryRepresentation)
		let expectationClass = mapping[kind]!
		if expectationClass == SliderPositionExpectation.self {
			return SliderPositionExpectation(kind: kind, modifiers: modifiers, element: element, timeout: timeout, value: params!.first! as! Double, tolerance: params!.count > 1 ? (params![1] as! Double) : nil)
		} else if expectationClass == ValueExpectation.self {
			return ValueExpectation(kind: kind, modifiers: modifiers, element: element, timeout: timeout, key: keyMapping[kind]!, value: params!.first!)
		} else if expectationClass == ToBeVisibleExpectation.self {
			let percentDouble = params != nil && params!.count > 0 ? params!.first as? Double : nil
			let percent = percentDouble != nil ? UInt(exactly: percentDouble!) : nil

			return ToBeVisibleExpectation(
				kind: kind,
				modifiers: modifiers,
				element: element,
				timeout: timeout,
				percent: percent
			)
		} else {
			return expectationClass.init(kind: kind, modifiers: modifiers, element: element, timeout: timeout)
		}
	}
	
	fileprivate func evaluate(with element: Element) throws -> Bool {
		fatalError("Unimplemented perform(on:) called for \(type(of: self))")
	}
	
	fileprivate func _evaluate() {
		var failureReason: String? = nil
		var assertion: Bool = false
		
		do {
			assertion = try evaluate(with: element)
		} catch {
			failureReason = error.localizedDescription
		}
		
		dtx_assert(applyModifiers(assertion, modifiers: modifiers), "Failed expectation: \(self.description)\(failureReason != nil ? ", \(failureReason!)" : "")", viewDescription: element.debugAttributes)
	}
	
	fileprivate func evaluate_after(startDate: Date, completionHandler: @escaping (Error?) -> Void) {
		let nowDate = Date()
		guard nowDate.timeIntervalSince(startDate) < timeout else {
			completionHandler(dtx_errorForFatalError("Timed out while waiting for expectation: \(self.description)", viewDescription: element.debugAttributes))
			return
		}
		
		let evaluationSuccess = dtx_try_nothrow {
			_evaluate()
		}
		
		guard evaluationSuccess == false else {
			completionHandler(nil)
			return;
		}
		
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
			self.evaluate_after(startDate: startDate, completionHandler: completionHandler)
		}
	}
	
	func evaluate(completionHandler: @escaping (Error?) -> Void) {
		async_expectation_dtx_try (completionHandler: completionHandler) {
			guard timeout != 0.0 else {
				_evaluate()
				completionHandler(nil)
				
				return
			}
			
			evaluate_after(startDate: Date(), completionHandler: completionHandler)
		}
	}
	
	fileprivate var additionalDescription: String {
		get {
			return ""
		}
	}
	
	static var durationFormatter : DTXDurationFormatter = DTXDurationFormatter()
	
	var description: String {
		get {
			return String(format: "%@%@%@ WITH %@%@", modifiers.contains(Modifier.not) ? "NOT " : "", self.kind.uppercased(), additionalDescription, element.description, timeout > 0.0 ? " TIMEOUT(\(Expectation.durationFormatter.string(fromTimeInterval: timeout)))" : "")
		}
	}
}

class ToBeVisibleExpectation : Expectation {
	let percent: UInt?
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval,
				  percent: UInt?) {
		self.percent = percent

		super.init(kind: kind, modifiers: modifiers, element: element, timeout: timeout)
	}
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval) {
		fatalError("Call the other initializer")
	}

	/// - NOTE This override is to support the special case where non-existent elements are also non-visible.
	override func _evaluate() {
		if self.modifiers.contains(Modifier.not) && element.exists == false {
			// Don't fail if view doesn't exist.
			return
		}
		
		var failureReason: String? = nil
		var assertion: Bool = false
		
		do {
			assertion = try evaluate(with: element)
		} catch {
			failureReason = error.localizedDescription
		}
		
		dtx_assert(applyModifiers(assertion, modifiers: modifiers), "Failed expectation: \(self.description)\(failureReason != nil ? ", \(failureReason!)" : "")", viewDescription: element.debugAttributes)
	}
	
	override func evaluate(with element: Element) throws -> Bool {
		return try element.isVisible(with: percent)
	}
}

class ToBeFocusedExpectation : Expectation {
	override func _evaluate() {
		dtx_assert(applyModifiers(self.element.isFocused(), modifiers: modifiers), "Failed expectation: \(self.description)", viewDescription: self.element.debugAttributes)
	}
}

class ToExistExpectation : Expectation {
	override func _evaluate() {
		dtx_assert(applyModifiers(self.element.exists, modifiers: modifiers), "Failed expectation: \(self.description)", viewDescription: self.element.debugAttributes)
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
	
	override func evaluate(with element: Element) -> Bool {
		return NSComparisonPredicate(leftExpression: NSExpression(forKeyPath: key), rightExpression: NSExpression(forConstantValue: value), modifier: .direct, type: .equalTo, options: []).evaluate(with: element)
	}
	
	override var additionalDescription: String {
		get {
			return "(\(key) == “\(value)”)"
		}
	}
}

class DoubleExpectation : Expectation {
	let value : Double
	let tolerance : Double?
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval, value: Double, tolerance: Double?) {
		//Tolerances outside of [DBL_EPSILON, 1) yield well-defined but useless results, so clamp the tolerance.
		self.value = value
		self.tolerance = tolerance != nil ? Double.minimum(Double.maximum(tolerance!, Double.ulpOfOne), 1.0 - Double.ulpOfOne) : nil
		
		super.init(kind: kind, modifiers: modifiers, element: element, timeout: timeout)
	}
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval) {
		fatalError("Call the other initializer")
	}
	
	required init(kind: String, modifiers: Set<String>, element: Element, timeout: TimeInterval, key: String, value: CustomStringConvertible) {
		fatalError("Call the other initializer")
	}
	
	fileprivate func valueToTest(from element: Element) -> Double {
		fatalError("Abstract method valueToTest(from:) called")
	}
	
	override func evaluate(with element: Element) -> Bool {
		return NSPredicate { view, _ -> Bool in
			self.valueToTest(from: element).isAlmostEqual(to: self.value, tolerance: self.tolerance ?? Double.ulpOfOne.squareRoot())
		}.evaluate(with: element)
	}
}

class SliderPositionExpectation : DoubleExpectation {
	override func valueToTest(from element: Element) -> Double {
		return element.normalizedSliderPosition
	}
	
	override var additionalDescription: String {
		get {
			return "(sliderPosition \(tolerance != nil ? "(~\(tolerance!))" : "")== “\(value)”)"
		}
	}
}
