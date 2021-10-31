//
//  Element.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/27/20.
//

import Foundation
import UIKit
import WebKit

class Element : NSObject {
	let predicate : Predicate
	let index : Int?
	
	struct Keys {
		static let predicate = "predicate"
		static let index = "atIndex"
	}
	
	required init(predicate: Predicate, index: Int?) {
		self.predicate = predicate
		self.index = index
	}
	
	class func with(dictionaryRepresentation: [String: Any]) throws -> Element {
		let predicateDictionaryRepresentation = dictionaryRepresentation[Keys.predicate] as! [String: Any]
		let index = dictionaryRepresentation[Keys.index] as! Int?
		
		return Element(predicate: try Predicate.with(dictionaryRepresentation: predicateDictionaryRepresentation), index: index)
	}
	
	var exists : Bool {
		do {
			var moreThanZero : Bool = false
			try dtx_try {
				moreThanZero = self.views.count > 0
			}
			return moreThanZero
		} catch {
			return false
		}
	}
	
	private var views : [NSObject] {
		//TODO: Consider searching here in all windows from all scenes.
		let array = (UIView.dtx_findViewsInKeySceneWindows(passing: predicate.predicateForQuery()) as! [NSObject])
		
		guard array.count > 0 else {
			dtx_fatalError("No elements found for “\(self.description)”", viewDescription: failDebugAttributes)
		}

		return array
	}
	
	private var view : NSObject {
		let array = self.views
		
		let element : NSObject
		if let index = index {
			guard index < array.count else {
				dtx_fatalError("Index \(index) beyond bounds \(array.count > 0 ? "[0 .. \(array.count - 1)] " : " ")for “\(self.description)”", viewDescription: failDebugAttributes)
			}
			element = array[index]
		} else {
			//Will fail test if more than one element are resolved from the query
			guard array.count == 1 else {
				dtx_fatalError("Multiple elements found for “\(self.description)”", viewDescription: failDebugAttributes)
			}
			element = array.first!
		}
		
		return element
	}
	
	private func extractScrollView() -> UIScrollView {
		if let view = self.view as? UIScrollView {
			return view
		}
		else if let view = self.view as? WKWebView {
			return view.scrollView
		} else if ReactNativeSupport.isReactNativeApp && NSStringFromClass(type(of: view)) == "RCTScrollView" {
			return (view.value(forKey: "scrollView") as! UIScrollView)
		}
		
		dtx_fatalError("View “\(self.view.dtx_shortDescription)” is not an instance of “UIScrollView”", viewDescription: debugAttributes)
	}
	
	override var description: String {
		return String(format: "MATCHER(%@)%@", predicate.description, index != nil ? " AT INDEX(\(index!))" : "")
	}
	
	fileprivate var failDebugAttributes: [String: Any] {
		return NSObject.dtx_genericElementDebugAttributes
	}
	
	var debugAttributes: [String: Any] {
		do {
			var rv: [String: Any]! = nil
			try dtx_try {
				rv = view.dtx_elementDebugAttributes
			}
			return rv
		} catch {
			return failDebugAttributes
		}
	}
	
	func tap(at point: CGPoint? = nil, numberOfTaps: Int = 1) {
		guard let point = point else {
			view.dtx_tapAtAccessibilityActivationPoint(withNumberOfTaps: UInt(numberOfTaps))
			return
		}
		
		view.dtx_tap(at: point, numberOfTaps: UInt(numberOfTaps))
	}
	
	func longPress(at point: CGPoint? = nil, duration: TimeInterval = 1.0) {
		guard let point = point else {
			view.dtx_longPressAtAccessibilityActivationPoint(forDuration: duration)
			return
		}
		
		view.dtx_longPress(at: point, duration: duration)
	}
	
	func longPress(at normalizedPoint: CGPoint, duration: TimeInterval, dragToElement targetElement: Element, normalizedTargetPoint: CGPoint, velocity: CGFloat, holdForDuration lastHoldDuration: TimeInterval) {
		view.dtx_longPress(at:normalizedPoint, duration:duration, target:targetElement.view, normalizedTargetPoint:normalizedTargetPoint, velocity:velocity, lastHoldDuration:lastHoldDuration)
	}
	
	func swipe(normalizedOffset: CGPoint, velocity: CGFloat = 1.0, normalizedStartingPoint: CGPoint? = nil) {
		if let normalizedStartingPoint = normalizedStartingPoint {
			view.dtx_swipe(withNormalizedOffset: normalizedOffset, velocity: velocity, normalizedStartingPoint: normalizedStartingPoint)
		} else {
			view.dtx_swipe(withNormalizedOffset: normalizedOffset, velocity: velocity)
		}
	}
	
	func pinch(withScale scale: CGFloat, velocity: CGFloat = 2.0, angle: CGFloat = 0.0) {
		view.dtx_pinch(withScale: scale, velocity: velocity, angle: angle)
	}
	
	func scroll(to edge: UIRectEdge) {
		let scrollView = extractScrollView()
		
		scrollView.dtx_scroll(to: edge)
	}

	func scroll(withOffset offset: CGPoint, normalizedStartingPoint: CGPoint? = nil) {
		let scrollView = extractScrollView()
		
		if let normalizedStartingPoint = normalizedStartingPoint {
			scrollView.dtx_scroll(withOffset: offset, normalizedStartingPoint: normalizedStartingPoint)
		} else {
			scrollView.dtx_scroll(withOffset: offset)
		}
	}
	
	func clearText() {
		view.dtx_clearText()
	}

	func typeText(_ text: String) {
		view.dtx_typeText(text)
	}

	func replaceText(_ text: String) {
		view.dtx_replaceText(text)
	}
	
	func adjust(toDate date: Date) {
		if let view = view as? UIDatePicker {
			view.dtx_adjust(to: date)
		} else {
			dtx_fatalError("View “\(view.dtx_shortDescription)” is not an instance of “UIDatePicker”", viewDescription: debugAttributes)
		}
	}
	
	func setComponent(_ component: Int, toValue value: Any) {
		if let view = view as? UIPickerView {
			view.dtx_setComponent(component, toValue: value)
		} else {
			dtx_fatalError("View “\(view.dtx_shortDescription)” is not an instance of “UIPickerView”", viewDescription: debugAttributes)
		}
	}
	
	func adjust(toNormalizedSliderPosition normalizedSliderPosition: Double) {
		guard let slider = view as? UISlider else {
			dtx_fatalError("View \(view.dtx_shortDescription) is not instance of “UISlider”", viewDescription: debugAttributes)
		}
		
		slider.dtx_normalizedSliderPosition = normalizedSliderPosition
	}
	
	func isVisible(with percent: UInt?)
	throws -> Bool {
		var error: NSError? = nil
		let isVisible = view.dtx_isVisible(
			at: view.dtx_bounds,
			percent: percent != nil ? NSNumber(value: percent!) : nil,
			error: &error
		)

		if let error = error {
			throw error
		}
		
		return isVisible
	}
	
	func isFocused() -> Bool {
		return view.dtx_isFocused()
	}
	
	func isHittable() throws -> Bool {
		var error: NSError? = nil
		let rv = view.dtx_isHittable(at: view.dtx_accessibilityActivationPointInViewCoordinateSpace, error: &error)
		if let error = error {
			throw error
		}
		
		return rv
	}
	
	func takeScreenshot(fileName: String?) -> [String : Any] {
		let path: URL = view.dtx_takeScreenshot(fileName)
		
		return ["screenshotPath": path.path]
	}
	
	@objc
	var text: String? {
		return view.value(forKey: "dtx_text") as? String
	}
	
	@objc
	var placeholder: String? {
		return view.value(forKey: "dtx_placeholder") as? String
	}
	
	@objc
	var identifier: String? {
		return view.accessibilityIdentifier
	}
	
	@objc
	var label: String? {
		return view.accessibilityLabel
	}
	
	@objc
	var value: String? {
		return view.accessibilityValue
	}
	
	@objc
	var normalizedSliderPosition: Double {
		get {
			guard let slider = view as? UISlider else {
				dtx_fatalError("View \(view.dtx_shortDescription) is not instance of “UISlider”", viewDescription: debugAttributes)
			}
			
			return slider.dtx_normalizedSliderPosition
		}
	}
	
	@objc
	var attributes: [String : Any] {
		let views = self.views
		
		if views.count == 1 {
			return views.first!.dtx_attributes
		} else {
			let elements = views.map {
				return $0.dtx_attributes
			}
			
			return ["elements": elements]
		}
	}
}
